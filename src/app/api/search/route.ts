import { NextResponse } from 'next/server'
import { authorizeRoles } from '@/lib/supabase/authorization'

type SearchResult = {
  id: string
  type: string
  title: string
  detail: string
  href: string
}

export async function GET(request: Request) {
  const auth = await authorizeRoles(['admin', 'employee'])
  if (!auth.authorized) return auth.response

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''

  if (query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  if (query.length > 80) {
    return NextResponse.json(
      { error: 'Search must be 80 characters or fewer.' },
      { status: 400 }
    )
  }

  const pattern = `%${query.replace(/[\\%_]/g, '\\$&')}%`
  const [
    wallsByNameResult,
    wallsByCodeResult,
    projectsResult,
    clientsResult,
  ] = await Promise.all([
    auth.supabase
      .from('walls')
      .select('id, wall_code, name')
      .ilike('name', pattern)
      .limit(5),
    auth.supabase
      .from('walls')
      .select('id, wall_code, name')
      .ilike('wall_code', pattern)
      .limit(5),
    auth.supabase
      .from('projects')
      .select('id, project_name, status')
      .ilike('project_name', pattern)
      .limit(5),
    auth.supabase
      .from('clients')
      .select('id, name')
      .ilike('name', pattern)
      .limit(5),
  ])

  const queryError =
    wallsByNameResult.error ||
    wallsByCodeResult.error ||
    projectsResult.error ||
    clientsResult.error

  if (queryError) {
    console.error('Workspace search error:', queryError)
    return NextResponse.json(
      { error: 'Workspace search is unavailable. Please try again.' },
      { status: 500 }
    )
  }

  const walls = Array.from(
    new Map(
      [...(wallsByNameResult.data ?? []), ...(wallsByCodeResult.data ?? [])].map(
        (wall) => [wall.id, wall]
      )
    ).values()
  )

  const results: SearchResult[] = []
  results.push(
    ...walls.map((wall): SearchResult => ({
      id: wall.id,
      type: 'Wall',
      title: wall.name,
      detail: wall.wall_code,
      href: `/dashboard/walls/${wall.id}`,
    }))
  )
  results.push(
    ...(projectsResult.data ?? []).map((project): SearchResult => ({
      id: project.id,
      type: 'Project',
      title: project.project_name,
      detail: project.status.replace('_', ' '),
      href: `/dashboard/projects/${project.id}`,
    }))
  )
  results.push(
    ...(clientsResult.data ?? []).map((client): SearchResult => ({
      id: client.id,
      type: 'Client',
      title: client.name,
      detail: 'Client',
      href: `/dashboard/projects?search=${encodeURIComponent(client.name)}`,
    }))
  )

  if (auth.role === 'admin') {
    const [namesResult, emailsResult] = await Promise.all([
      auth.supabase
        .from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', pattern)
        .limit(5),
      auth.supabase
        .from('profiles')
        .select('id, full_name, email')
        .ilike('email', pattern)
        .limit(5),
    ])

    if (namesResult.error || emailsResult.error) {
      console.error(
        'Employee search error:',
        namesResult.error ?? emailsResult.error
      )
      return NextResponse.json(
        { error: 'Employee search is unavailable. Please try again.' },
        { status: 500 }
      )
    }

    const employees = Array.from(
      new Map(
        [...(namesResult.data ?? []), ...(emailsResult.data ?? [])].map(
          (employee) => [employee.id, employee]
        )
      ).values()
    )

    results.push(
      ...employees.map((employee): SearchResult => ({
        id: employee.id,
        type: 'Employee',
        title: employee.full_name,
        detail: employee.email,
        href: `/dashboard/employees/${employee.id}`,
      }))
    )
  }

  return NextResponse.json({ results })
}
