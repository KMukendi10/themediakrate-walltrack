import { NextResponse } from 'next/server'
import { authorizeRoles } from '@/lib/supabase/authorization'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await authorizeRoles(['admin'])
  if (!auth.authorized) return auth.response

  const { id: projectId } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const wallId =
    body && typeof body === 'object' && 'wall_id' in body
      ? body.wall_id
      : null

  if (typeof wallId !== 'string' || !wallId) {
    return NextResponse.json(
      { error: 'Select a valid wall to assign.' },
      { status: 400 }
    )
  }

  const { data: project, error: projectError } = await auth.supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .maybeSingle()

  if (projectError) {
    console.error('Project assignment lookup error:', projectError)
    return NextResponse.json(
      { error: 'Unable to verify the project.' },
      { status: 500 }
    )
  }

  if (!project) {
    return NextResponse.json({ error: 'Project not found.' }, { status: 404 })
  }

  const { data: wall, error: wallError } = await auth.supabase
    .from('walls')
    .select('id')
    .eq('id', wallId)
    .maybeSingle()

  if (wallError) {
    console.error('Wall assignment lookup error:', wallError)
    return NextResponse.json(
      { error: 'Unable to verify the wall.' },
      { status: 500 }
    )
  }

  if (!wall) {
    return NextResponse.json({ error: 'Wall not found.' }, { status: 404 })
  }

  const { data: existingAssignment, error: assignmentLookupError } =
    await auth.supabase
      .from('wall_projects')
      .select('id')
      .eq('project_id', projectId)
      .eq('wall_id', wallId)
      .maybeSingle()

  if (assignmentLookupError) {
    console.error('Existing assignment lookup error:', assignmentLookupError)
    return NextResponse.json(
      { error: 'Unable to check existing wall assignments.' },
      { status: 500 }
    )
  }

  if (existingAssignment) {
    return NextResponse.json(
      { error: 'This wall is already assigned to the project.' },
      { status: 409 }
    )
  }

  const { error } = await auth.supabase.from('wall_projects').insert({
    project_id: projectId,
    wall_id: wallId,
  })

  if (error) {
    console.error('Wall assignment error:', error)
    return NextResponse.json(
      { error: 'Unable to assign this wall.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function DELETE(request: Request, { params }: RouteContext) {
  const auth = await authorizeRoles(['admin'])
  if (!auth.authorized) return auth.response

  const { id: projectId } = await params
  const { searchParams } = new URL(request.url)
  const assignmentId = searchParams.get('assignment_id')

  if (!assignmentId) {
    return NextResponse.json(
      { error: 'An assignment ID is required.' },
      { status: 400 }
    )
  }

  const { data, error } = await auth.supabase
    .from('wall_projects')
    .delete()
    .eq('id', assignmentId)
    .eq('project_id', projectId)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Wall assignment removal error:', error)
    return NextResponse.json(
      { error: 'Unable to remove this wall assignment.' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Wall assignment not found.' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true })
}
