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
