
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Suspense } from 'react'
import Link from 'next/link'
import {
  Activity,
  BriefcaseBusiness,
  ClipboardCheck,
  PanelsTopLeft,
  Users,
} from 'lucide-react'

import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import { getUserDatePreferences } from '@/lib/user-date-preferences'
import { formatAppDate } from '@/lib/date-format'

function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-white">
      <p className="text-sm text-gray-400">
        Loading WallTrack workspace...
      </p>
    </div>
  )
}

async function DashboardContent() {
  // Wait for the incoming request before accessing user-specific data.
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Dashboard profile lookup error:', profileError)
  }
  const datePreferences = await getUserDatePreferences(supabase, user.id)

  const isAdmin = profile?.role === 'admin'
  const [wallsResult, projectsResult, inspectionsResult, employeesResult, recentInspectionsResult] =
    await Promise.all([
      supabase.from('walls').select('id', { count: 'exact', head: true }).neq('status', 'removed'),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('inspections').select('id', { count: 'exact', head: true }),
      isAdmin
        ? supabase.from('profiles').select('id', { count: 'exact', head: true })
        : Promise.resolve({ count: null, error: null }),
      supabase
        .from('inspections')
        .select('id, wall_id, condition, inspection_date, created_at')
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  const queryErrors = [
    wallsResult.error,
    projectsResult.error,
    inspectionsResult.error,
    employeesResult.error,
    recentInspectionsResult.error,
  ].filter(Boolean)

  queryErrors.forEach((queryError) =>
    console.error('Dashboard data query error:', queryError)
  )

  const recentInspections = recentInspectionsResult.data ?? []
  const wallIds = [...new Set(recentInspections.map((inspection) => inspection.wall_id))]
  const { data: recentWalls, error: recentWallsError } =
    wallIds.length > 0
      ? await supabase.from('walls').select('id, name, wall_code').in('id', wallIds)
      : { data: [], error: null }

  if (recentWallsError) {
    console.error('Dashboard recent wall lookup error:', recentWallsError)
  }

  const wallById = new Map((recentWalls ?? []).map((wall) => [wall.id, wall]))
  const stats = [
    {
      title: 'Total Walls',
      value: wallsResult.error ? 'Unavailable' : String(wallsResult.count ?? 0),
      detail: 'Registered advertising locations',
      href: '/dashboard/walls',
      icon: PanelsTopLeft,
    },
    {
      title: 'Active Projects',
      value: projectsResult.error ? 'Unavailable' : String(projectsResult.count ?? 0),
      detail: 'Currently running campaigns',
      href: '/dashboard/projects?status=active',
      icon: BriefcaseBusiness,
    },
    {
      title: 'Inspections',
      value: inspectionsResult.error ? 'Unavailable' : String(inspectionsResult.count ?? 0),
      detail: 'Recorded inspection history',
      href: '/dashboard/inspections',
      icon: ClipboardCheck,
    },
    ...(isAdmin
      ? [{
          title: 'Employees',
          value: employeesResult.error ? 'Unavailable' : String(employeesResult.count ?? 0),
          detail: 'Registered team accounts',
          href: '/dashboard/employees',
          icon: Users,
        }]
      : []),
  ]

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Employee'} />

        <main className="p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
              OVERVIEW
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Welcome to your WallTrack workspace.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <Link
                href={stat.href}
                key={stat.title}
                className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6 transition hover:border-[#E7FF3C]/40"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">{stat.title}</p>
                  <stat.icon size={19} className="text-[#E7FF3C]" />
                </div>
                <p className="mt-4 text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-3 text-xs text-gray-500">{stat.detail}</p>
              </Link>
            ))}
          </div>

          <section className="mt-8 rounded-xl border border-white/10 bg-[#1B1B1B]">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div>
                <h2 className="text-lg font-bold">Recent Inspections</h2>
                <p className="mt-1 text-sm text-gray-500">Latest records from your workspace</p>
              </div>
              <Link href="/dashboard/inspections" className="text-sm text-[#E7FF3C] hover:underline">
                View all
              </Link>
            </div>
            {recentInspectionsResult.error ? (
              <p className="p-6 text-sm text-red-400">Unable to load recent inspections.</p>
            ) : recentInspections.length === 0 ? (
              <div className="p-8 text-center">
                <Activity className="mx-auto text-gray-600" size={28} />
                <p className="mt-3 text-sm text-gray-400">No inspections have been recorded yet.</p>
                <Link href="/dashboard/inspections/new" className="mt-3 inline-block text-sm text-[#E7FF3C] hover:underline">
                  Record an inspection
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentInspections.map((inspection) => {
                  const wall = wallById.get(inspection.wall_id)
                  return (
                    <Link
                      key={inspection.id}
                      href={`/dashboard/inspections/${inspection.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 px-6 py-4 hover:bg-white/[0.03]"
                    >
                      <span>
                        <span className="block text-sm font-medium text-white">
                          {wall?.name ?? 'Wall record unavailable'}
                        </span>
                        <span className="mt-1 block text-xs capitalize text-gray-500">
                          {wall?.wall_code ? `${wall.wall_code} · ` : ''}{inspection.condition.replace('_', ' ')}
                        </span>
                      </span>
                      <time className="text-xs text-gray-500">
                        {formatAppDate(inspection.created_at, datePreferences)}
                      </time>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {/* Workspace onboarding guidance */}
          <div className="mt-8 rounded-xl border border-white/10 bg-[#1B1B1B] p-8">
            <h2 className="text-lg font-bold">
              Welcome to WallTrack
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Review registered walls, active projects and inspection activity from your workspace.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}
