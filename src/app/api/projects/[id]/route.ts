import { NextResponse } from 'next/server'
import { authorizeRoles } from '@/lib/supabase/authorization'
import { parseProjectInput } from '@/lib/validation/project'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeRoles(['admin'])
  if (!auth.authorized) return auth.response

  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const project = parseProjectInput(body)
  if (!project) {
    return NextResponse.json(
      { error: 'Please provide valid project details and dates.' },
      { status: 400 }
    )
  }

  if (project.client_id) {
    const { data: client, error: clientError } = await auth.supabase
      .from('clients')
      .select('id')
      .eq('id', project.client_id)
      .maybeSingle()

    if (clientError) {
      console.error('Project client lookup error:', clientError)
      return NextResponse.json(
        { error: 'Unable to verify the selected client.' },
        { status: 500 }
      )
    }

    if (!client) {
      return NextResponse.json(
        { error: 'The selected client no longer exists. Choose another client.' },
        { status: 404 }
      )
    }
  }

  const { data, error } = await auth.supabase
    .from('projects')
    .update(project)
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Project update error:', error)
    return NextResponse.json(
      { error: 'Unable to update project.' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
  }

  return NextResponse.json({ id: data.id })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeRoles(['admin'])
  if (!auth.authorized) return auth.response

  const { id } = await params
  const admin = createAdminClient()
  const { data: project, error: lookupError } = await admin
    .from('projects')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (lookupError) {
    console.error('Project deletion lookup error:', lookupError)
    return NextResponse.json(
      { error: 'Unable to verify this project.' },
      { status: 500 }
    )
  }

  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
  }

  const { error: assignmentsError } = await admin
    .from('wall_projects')
    .delete()
    .eq('project_id', id)

  if (assignmentsError) {
    console.error('Project assignment deletion error:', assignmentsError)
    return NextResponse.json(
      { error: 'Could not remove the project’s wall assignments. The project was not deleted; retry.' },
      { status: 500 }
    )
  }

  const { data, error } = await admin
    .from('projects')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Project deletion error:', error)
    return NextResponse.json(
      { error: 'Wall assignments were removed, but the project could not be deleted. Refresh and retry.' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
  }

  return NextResponse.json({ id: data.id, deleted: true })
}
