import { NextResponse } from 'next/server'
import { authorizeRoles } from '@/lib/supabase/authorization'
import { parseProjectInput } from '@/lib/validation/project'

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
