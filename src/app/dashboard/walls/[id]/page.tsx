
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Ruler,
  CalendarDays,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

type WallDetailsProps = {
  params: Promise<{
    id: string
  }>
}

type Wall = {
  id: string
  wall_code: string
  name: string
  description: string | null
  wall_type: string | null
  address: string | null
  suburb: string | null
  city: string | null
  province: string | null
  postal_code: string | null
  latitude: number
  longitude: number
  location_method: string
  gps_accuracy: number | null
  width_m: number | null
  height_m: number | null
  status: string
  registered_by: string | null
  created_at: string
  updated_at: string
}

type Project = {
  id: string
  project_name: string
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
}

const statusStyles: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400',
  inactive: 'bg-gray-500/10 text-gray-400',
  under_maintenance: 'bg-orange-500/10 text-orange-400',
  removed: 'bg-red-500/10 text-red-400',
}

const projectStatusStyles: Record<string, string> = {
  planning: 'bg-blue-500/10 text-blue-400',
  active: 'bg-green-500/10 text-green-400',
  completed: 'bg-gray-500/10 text-gray-400',
  cancelled: 'bg-red-500/10 text-red-400',
}

function LoadingDetails() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-white">
      <p className="text-sm text-gray-400">
        Loading wall details...
      </p>
    </div>
  )
}

async function WallDetailsContent({
  params,
}: WallDetailsProps) {
  await connection()

  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: wallData, error: wallError } = await supabase
    .from('walls')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (wallError) {
    console.error('Wall details database error:', wallError)

    return (
      <div className="flex min-h-screen bg-[#111111] text-white">
        <Sidebar />

        <div className="min-w-0 flex-1">
          <Topbar email={user.email ?? 'Employee'} />

          <main className="p-8">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle
                  size={22}
                  className="text-red-400"
                />

                <h2 className="text-lg font-bold">
                  Unable to Load Wall Details
                </h2>
              </div>

              <p className="mt-3 text-sm leading-6 text-red-300">
                Something went wrong while retrieving this wall from the database.
              </p>

              <p className="mt-2 text-xs text-red-400">
                Error code: {wallError.code ?? 'Unknown'}
              </p>

              <p className="mt-1 text-xs text-red-400">
                {wallError.message}
              </p>

              <Link
                href="/dashboard/walls"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#E7FF3C] hover:underline"
              >
                <ArrowLeft size={16} />
                Back to Wall Management
              </Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!wallData) {
    notFound()
  }

  const wall = wallData as Wall

  const {
    data: assignments,
    error: assignmentsError,
  } = await supabase
    .from('wall_projects')
    .select('project_id, installation_date, completion_date, notes')
    .eq('wall_id', wall.id)

  if (assignmentsError) {
    console.error(
      'Wall project assignments error:',
      assignmentsError
    )
  }

  const projectIds = (assignments ?? []).map(
    (assignment) => assignment.project_id
  )

  let projects: Project[] = []

  if (projectIds.length > 0) {
    const { data: projectData, error: projectError } =
      await supabase
        .from('projects')
        .select(
          'id, project_name, description, status, start_date, end_date'
        )
        .in('id', projectIds)

    if (projectError) {
      console.error('Wall projects database error:', projectError)
    }

    projects = (projectData ?? []) as Project[]
  }

  const location = [
    wall.address,
    wall.suburb,
    wall.city,
    wall.province,
    wall.postal_code,
  ]
    .filter(Boolean)
    .join(', ')

  const formattedDate = (date: string | null) => {
    if (!date) return 'Not specified'

    return new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Employee'} />

        <main className="p-6 lg:p-8">
          <Link
            href="/dashboard/walls"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#E7FF3C]"
          >
            <ArrowLeft size={16} />
            Back to Wall Management
          </Link>

          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md bg-[#E7FF3C]/10 px-3 py-1.5 text-xs font-semibold text-[#E7FF3C]">
                  {wall.wall_code}
                </span>

                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    statusStyles[wall.status] ??
                    'bg-gray-500/10 text-gray-400'
                  }`}
                >
                  {wall.status.replaceAll('_', ' ')}
                </span>
              </div>

              <h1 className="mt-4 text-3xl font-bold">
                {wall.name}
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Wall details and location information
              </p>
            </div>

            <Link
              href={`/dashboard/map?wall=${wall.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm font-medium text-gray-300 transition hover:border-[#E7FF3C] hover:text-[#E7FF3C]"
            >
              <MapPin size={17} />
              View on Map
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
                <h2 className="mb-6 text-lg font-bold">
                  General Information
                </h2>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Wall Name</p>
                    <p className="mt-2 text-sm font-medium">{wall.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Wall Code</p>
                    <p className="mt-2 text-sm font-medium">{wall.wall_code}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Wall Type</p>
                    <p className="mt-2 text-sm font-medium">
                      {wall.wall_type || 'Not specified'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Current Status</p>
                    <p className="mt-2 text-sm font-medium capitalize">
                      {wall.status.replaceAll('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="mt-6 border-t border-white/10 pt-6">
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="mt-2 text-sm leading-6 text-gray-300">
                    {wall.description || 'No description provided.'}
                  </p>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
                <div className="mb-6 flex items-center gap-3">
                  <MapPin size={20} className="text-[#E7FF3C]" />
                  <h2 className="text-lg font-bold">
                    Location Information
                  </h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">Full Address</p>
                    <p className="mt-2 text-sm text-gray-300">
                      {location || 'No address recorded'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Latitude</p>
                    <p className="mt-2 text-sm font-medium">{wall.latitude}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Longitude</p>
                    <p className="mt-2 text-sm font-medium">{wall.longitude}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Location Method</p>
                    <p className="mt-2 text-sm capitalize">
                      {wall.location_method}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">GPS Accuracy</p>
                    <p className="mt-2 text-sm">
                      {wall.gps_accuracy !== null
                        ? `${wall.gps_accuracy} metres`
                        : 'Not recorded'}
                    </p>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
                <div className="mb-6 flex items-center gap-3">
                  <Ruler size={20} className="text-[#E7FF3C]" />
                  <h2 className="text-lg font-bold">
                    Physical Specifications
                  </h2>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-gray-500">Width</p>
                    <p className="mt-2 text-2xl font-bold">
                      {wall.width_m !== null ? `${wall.width_m} m` : '—'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Height</p>
                    <p className="mt-2 text-2xl font-bold">
                      {wall.height_m !== null ? `${wall.height_m} m` : '—'}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500">
                      Total Surface Area
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#E7FF3C]">
                      {wall.width_m !== null && wall.height_m !== null
                        ? `${(wall.width_m * wall.height_m).toFixed(2)} m²`
                        : 'Not available'}
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
                <div className="mb-5 flex items-center gap-3">
                  <FolderKanban size={20} className="text-[#E7FF3C]" />
                  <h2 className="text-lg font-bold">Assigned Projects</h2>
                </div>

                {assignmentsError ? (
                  <p className="text-sm text-red-400">
                    Unable to load project assignments.
                  </p>
                ) : projects.length === 0 ? (
                  <div className="py-6 text-center">
                    <FolderKanban
                      size={28}
                      className="mx-auto text-gray-600"
                    />
                    <p className="mt-3 text-sm text-gray-400">
                      No projects assigned
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      Project assignments will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => {
                      const assignment = assignments?.find(
                        (item) => item.project_id === project.id
                      )

                      return (
                        <div
                          key={project.id}
                          className="rounded-lg border border-white/10 bg-[#111111] p-4"
                        >
                          <h3 className="text-sm font-semibold">
                            {project.project_name}
                          </h3>

                          <span
                            className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs ${
                              projectStatusStyles[project.status] ??
                              'bg-gray-500/10 text-gray-400'
                            }`}
                          >
                            {project.status}
                          </span>

                          {project.description && (
                            <p className="mt-3 text-xs leading-5 text-gray-500">
                              {project.description}
                            </p>
                          )}

                          <div className="mt-4 space-y-2 text-xs text-gray-500">
                            <p>
                              Installation:{' '}
                              {formattedDate(
                                assignment?.installation_date ?? null
                              )}
                            </p>
                            <p>
                              Completion:{' '}
                              {formattedDate(
                                assignment?.completion_date ?? null
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
                <h2 className="mb-5 text-lg font-bold">
                  Registration Details
                </h2>

                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <CalendarDays
                      size={18}
                      className="mt-0.5 text-[#E7FF3C]"
                    />
                    <div>
                      <p className="text-xs text-gray-500">Date Registered</p>
                      <p className="mt-1 text-sm">
                        {formattedDate(wall.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock
                      size={18}
                      className="mt-0.5 text-[#E7FF3C]"
                    />
                    <div>
                      <p className="text-xs text-gray-500">Last Updated</p>
                      <p className="mt-1 text-sm">
                        {formattedDate(wall.updated_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    {wall.status === 'active' ? (
                      <CheckCircle2
                        size={18}
                        className="mt-0.5 text-green-400"
                      />
                    ) : (
                      <AlertTriangle
                        size={18}
                        className="mt-0.5 text-orange-400"
                      />
                    )}
                    <div>
                      <p className="text-xs text-gray-500">Wall Availability</p>
                      <p className="mt-1 text-sm capitalize">
                        {wall.status.replaceAll('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function WallDetailsPage({
  params,
}: WallDetailsProps) {
  return (
    <Suspense fallback={<LoadingDetails />}>
      <WallDetailsContent params={params} />
    </Suspense>
  )
}
