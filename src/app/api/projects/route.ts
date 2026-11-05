import { NextResponse } from 'next/server'
import { authorizeRoles } from '@/lib/supabase/authorization'
import { parseProjectInput } from '@/lib/validation/project'

export async function POST(request: Request) {
  const auth = await authorizeRoles(['admin'])
  if (!auth.authorized) return auth.response

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
    .insert(project)
    .select('id')
    .single()

  if (error) {
    console.error('Project creation error:', error)
    return NextResponse.json(
      { error: 'Unable to create project. Please check the details and try again.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
