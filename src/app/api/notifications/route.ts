import { NextResponse } from 'next/server'
import { authorizeRoles } from '@/lib/supabase/authorization'
import { getUserDatePreferences } from '@/lib/user-date-preferences'

export async function GET() {
  const auth = await authorizeRoles(['admin', 'employee'])
  if (!auth.authorized) return auth.response

  const { data: inspections, error } = await auth.supabase
    .from('inspections')
    .select('id, wall_id, condition, inspection_date, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Recent inspection notifications error:', error)
    return NextResponse.json(
      { error: 'Recent updates are unavailable. Please try again.' },
      { status: 500 }
    )
  }

  const wallIds = [...new Set((inspections ?? []).map((item) => item.wall_id))]
  const { data: walls, error: wallsError } =
    wallIds.length > 0
      ? await auth.supabase
          .from('walls')
          .select('id, name, wall_code')
          .in('id', wallIds)
      : { data: [], error: null }

  if (wallsError) {
    console.error('Recent inspection wall lookup error:', wallsError)
    return NextResponse.json(
      { error: 'Recent updates are unavailable. Please try again.' },
      { status: 500 }
    )
  }

  const wallById = new Map((walls ?? []).map((wall) => [wall.id, wall]))
  const datePreferences = await getUserDatePreferences(
    auth.supabase,
    auth.user.id
  )
  const results = (inspections ?? []).map((inspection) => {
    const wall = wallById.get(inspection.wall_id)
    return {
      id: inspection.id,
      title: wall?.name ?? 'Wall record unavailable',
      detail: `${wall?.wall_code ? `${wall.wall_code} · ` : ''}${inspection.condition.replace('_', ' ')}`,
      href: `/dashboard/inspections/${inspection.id}`,
      createdAt: inspection.created_at,
    }
  })

  return NextResponse.json({ results, datePreferences })
}
