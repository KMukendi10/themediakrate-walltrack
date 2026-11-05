
import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import {
  ClipboardCheck,
  Plus,
  CalendarDays,
  MapPin,
  UserRound,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

type Inspection = {
  id: string
  wall_id: string
  condition: string
  notes: string | null
  inspection_date: string
  inspected_by: string | null
  created_at: string
}

type Wall = {
  id: string
  wall_code: string
  name: string
}

type Profile = {
  id: string
  full_name: string
}

const conditionStyles: Record<string, string> = {
  excellent: 'bg-green-500/10 text-green-400',
  good: 'bg-emerald-500/10 text-emerald-400',
  fair: 'bg-yellow-500/10 text-yellow-400',
  poor: 'bg-orange-500/10 text-orange-400',
  damaged: 'bg-red-500/10 text-red-400',
}

function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-white">
      <p className="text-sm text-gray-400">
        Loading inspections...
      </p>
    </div>
  )
}

async function InspectionsContent() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const {
    data: inspectionData,
    error: inspectionError,
  } = await supabase
    .from('inspections')
    .select(
      'id, wall_id, condition, notes, inspection_date, inspected_by, created_at'
    )
    .order('inspection_date', { ascending: false })

  const inspections = (inspectionData ?? []) as Inspection[]

  const wallIds = [...new Set(
    inspections.map((inspection) => inspection.wall_id)
  )]

  const profileIds = [...new Set(
    inspections
      .map((inspection) => inspection.inspected_by)
      .filter((id): id is string => Boolean(id))
  )]

  let walls: Wall[] = []
  let profiles: Profile[] = []

  if (wallIds.length > 0) {
    const { data } = await supabase
      .from('walls')
      .select('id, wall_code, name')
      .in('id', wallIds)

    walls = (data ?? []) as Wall[]
  }

  if (profileIds.length > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', profileIds)

    profiles = (data ?? []) as Profile[]
  }

  const wallMap = new Map(
    walls.map((wall) => [wall.id, wall])
  )

  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile])
  )

  const needsAttention = inspections.filter((inspection) =>
    ['poor', 'damaged'].includes(
      inspection.condition.toLowerCase()
    )
  ).length

  const goodCondition = inspections.filter((inspection) =>
    ['excellent', 'good'].includes(
      inspection.condition.toLowerCase()
    )
  ).length

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Employee'} />

        <main className="p-6 lg:p-8">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
                FIELD OPERATIONS
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Inspections
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Monitor advertising wall conditions and inspection history.
              </p>
            </div>

            <Link
              href="/dashboard/inspections/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d4ec32]"
            >
              <Plus size={18} />
              Record Inspection
            </Link>
          </div>

          <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Total Inspections
                </p>
                <ClipboardCheck size={20} className="text-[#E7FF3C]" />
              </div>

              <p className="mt-4 text-4xl font-bold text-white">
                {inspections.length}
              </p>

              <p className="mt-3 text-xs text-gray-500">
                Recorded inspections
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Good Condition
                </p>
                <CheckCircle2 size={20} className="text-green-400" />
              </div>

              <p className="mt-4 text-4xl font-bold text-green-400">
                {goodCondition}
              </p>

              <p className="mt-3 text-xs text-gray-500">
                Excellent or good condition
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Needs Attention
                </p>
                <AlertTriangle size={20} className="text-orange-400" />
              </div>

              <p className="mt-4 text-4xl font-bold text-orange-400">
                {needsAttention}
              </p>

              <p className="mt-3 text-xs text-gray-500">
                Poor or damaged walls
              </p>
            </div>
          </div>

          <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1B1B1B]">
            <div className="border-b border-white/10 p-6">
              <h2 className="text-lg font-bold">
                Inspection History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View previously recorded wall inspections.
              </p>
            </div>

            {inspectionError ? (
              <div className="p-8">
                <p className="text-sm text-red-400">
                  Unable to load inspections. Please try again.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {inspectionError.message}
                </p>
              </div>
            ) : inspections.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <ClipboardCheck
                  size={40}
                  className="mx-auto text-gray-600"
                />

                <h3 className="mt-4 text-lg font-semibold">
                  No inspections recorded yet
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Start by recording an inspection for one of your advertising walls.
                </p>

                <Link
                  href="/dashboard/inspections/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d4ec32]"
                >
                  <Plus size={17} />
                  Record First Inspection
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {inspections.map((inspection) => {
                  const wall = wallMap.get(inspection.wall_id)

                  const inspector = inspection.inspected_by
                    ? profileMap.get(inspection.inspected_by)
                    : null

                  const condition = inspection.condition.toLowerCase()

                  return (
                    <div
                      key={inspection.id}
                      className="p-6 transition hover:bg-white/[0.02]"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm font-semibold text-white">
                              {wall?.name ?? 'Unknown Wall'}
                            </span>

                            {wall?.wall_code && (
                              <span className="rounded-md bg-[#E7FF3C]/10 px-2 py-1 text-xs font-semibold text-[#E7FF3C]">
                                {wall.wall_code}
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                            <span className="flex items-center gap-2">
                              <CalendarDays size={14} />
                              {formatDate(inspection.inspection_date)}
                            </span>

                            <span className="flex items-center gap-2">
                              <UserRound size={14} />
                              {inspector?.full_name ?? 'Unknown inspector'}
                            </span>
                          </div>

                          {inspection.notes && (
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
                              {inspection.notes}
                            </p>
                          )}
                        </div>

                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                            conditionStyles[condition] ??
                            'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          {inspection.condition}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default function InspectionsPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <InspectionsContent />
    </Suspense>
  )
}
