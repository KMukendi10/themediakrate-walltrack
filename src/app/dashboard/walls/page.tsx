
import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import {
  Plus,
  Search,
  MapPin,
  Ruler,
  Building2,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

type WallsPageProps = {
  searchParams: Promise<{
    success?: string
    error?: string
    search?: string
    status?: string
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
  width_m: number | null
  height_m: number | null
  status: string
}

type WallProject = {
  wall_id: string
  project_id: string
}

type Project = {
  id: string
  project_name: string
  status: string
}

const statusLabels: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  under_maintenance: 'Under Maintenance',
  removed: 'Removed',
}

function WallsLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-white">
      <p className="text-sm text-gray-400">
        Loading wall management...
      </p>
    </div>
  )
}

async function WallsContent({
  searchParams,
}: WallsPageProps) {
  await connection()

  const params = await searchParams
  const success = params.success
  const errorMessage = params.error
  const searchTerm = params.search?.trim() ?? ''
  const selectedStatus = params.status ?? 'all'

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const [
    { data: wallsData, error: wallsError },
    { data: wallProjectsData },
    { data: projectsData },
  ] = await Promise.all([
    supabase
      .from('walls')
      .select(
        'id, wall_code, name, description, wall_type, address, suburb, city, province, width_m, height_m, status'
      )
      .order('created_at', { ascending: false }),

    supabase
      .from('wall_projects')
      .select('wall_id, project_id'),

    supabase
      .from('projects')
      .select('id, project_name, status'),
  ])

  const walls = (wallsData ?? []) as Wall[]
  const wallProjects = (wallProjectsData ?? []) as WallProject[]
  const projects = (projectsData ?? []) as Project[]

  const activeProjectIds = new Set(
    projects
      .filter((project) => project.status === 'active')
      .map((project) => project.id)
  )

  const activeAssignments = new Map<string, string[]>()

  wallProjects.forEach((assignment) => {
    if (!activeProjectIds.has(assignment.project_id)) {
      return
    }

    const current = activeAssignments.get(assignment.wall_id) ?? []
    current.push(assignment.project_id)
    activeAssignments.set(assignment.wall_id, current)
  })

  const activeWalls = walls.filter(
    (wall) => wall.status === 'active'
  )

  const occupiedWalls = activeWalls.filter(
    (wall) =>
      (activeAssignments.get(wall.id)?.length ?? 0) > 0
  )

  const availableWalls = activeWalls.filter(
    (wall) =>
      (activeAssignments.get(wall.id)?.length ?? 0) === 0
  )

  const maintenanceWalls = walls.filter(
    (wall) => wall.status === 'under_maintenance'
  )

  const filteredWalls = walls.filter((wall) => {
    const searchableText = [
      wall.name,
      wall.wall_code,
      wall.address,
      wall.suburb,
      wall.city,
      wall.province,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    const matchesSearch =
      !searchTerm ||
      searchableText.includes(searchTerm.toLowerCase())

    const matchesStatus =
      selectedStatus === 'all' ||
      wall.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  const getLocation = (wall: Wall) => {
    return [
      wall.address,
      wall.suburb,
      wall.city,
      wall.province,
    ]
      .filter(Boolean)
      .join(', ')
  }

  const getProjectNames = (wallId: string) => {
    const projectIds = activeAssignments.get(wallId) ?? []

    return projects
      .filter((project) => projectIds.includes(project.id))
      .map((project) => project.project_name)
  }

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Employee'} />

        <main className="p-6 lg:p-8">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
                WALL MANAGEMENT
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Advertising Walls
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Manage and monitor your registered advertising locations.
              </p>
            </div>

            <Link
              href="/dashboard/walls/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E7FF3C] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#d6ed32]"
            >
              <Plus size={18} />
              Add New Wall
            </Link>
          </div>

          {success && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
              <CheckCircle2 size={18} />
              {success}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertTriangle size={18} />
              {errorMessage}
            </div>
          )}

          {wallsError && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              Unable to load walls. Please refresh the page or try again later.
            </div>
          )}

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: 'Total Walls',
                value: walls.length,
                detail: 'Registered locations',
                icon: Building2,
              },
              {
                title: 'Occupied Walls',
                value: occupiedWalls.length,
                detail: 'Assigned to active projects',
                icon: CheckCircle2,
              },
              {
                title: 'Available Walls',
                value: availableWalls.length,
                detail: 'Ready for campaigns',
                icon: LayoutGrid,
              },
              {
                title: 'Under Maintenance',
                value: maintenanceWalls.length,
                detail: 'Currently unavailable',
                icon: AlertTriangle,
              },
            ].map((stat) => {
              const Icon = stat.icon

              return (
                <div
                  key={stat.title}
                  className="rounded-xl border border-white/10 bg-[#1B1B1B] p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400">
                      {stat.title}
                    </p>

                    <Icon size={19} className="text-[#E7FF3C]" />
                  </div>

                  <p className="mt-4 text-3xl font-bold text-[#E7FF3C]">
                    {stat.value}
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    {stat.detail}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="rounded-xl border border-white/10 bg-[#1B1B1B]">
            <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-lg font-bold">
                  Registered Walls
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {filteredWalls.length} of {walls.length} walls displayed
                </p>
              </div>

              <form
                action="/dashboard/walls"
                method="GET"
                className="flex flex-col gap-3 sm:flex-row"
              >
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    type="search"
                    name="search"
                    defaultValue={searchTerm}
                    placeholder="Search walls..."
                    className="w-full rounded-lg border border-white/10 bg-[#111111] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#E7FF3C] sm:w-64"
                  />
                </div>

                <select
                  name="status"
                  defaultValue={selectedStatus}
                  className="rounded-lg border border-white/10 bg-[#111111] px-4 py-2.5 text-sm text-gray-300 outline-none focus:border-[#E7FF3C]"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="under_maintenance">
                    Under Maintenance
                  </option>
                  <option value="removed">Removed</option>
                </select>

                <button
                  type="submit"
                  className="rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/15"
                >
                  Apply
                </button>
              </form>
            </div>

            {filteredWalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Building2 size={28} className="text-gray-500" />
                </div>

                <h3 className="text-lg font-semibold">
                  {walls.length === 0
                    ? 'No walls registered yet'
                    : 'No matching walls found'}
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  {walls.length === 0
                    ? 'Start building your wall database by registering your first advertising location.'
                    : 'Try changing your search term or status filter.'}
                </p>

                {walls.length === 0 && (
                  <Link
                    href="/dashboard/walls/new"
                    className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#E7FF3C] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#d6ed32]"
                  >
                    <Plus size={17} />
                    Register First Wall
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {filteredWalls.map((wall) => {
                  const location = getLocation(wall)
                  const projectNames = getProjectNames(wall.id)

                  return (
                    <div
                      key={wall.id}
                      className="flex flex-col gap-5 p-5 transition hover:bg-white/[0.02] lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-md bg-[#E7FF3C]/10 px-2.5 py-1 text-xs font-semibold text-[#E7FF3C]">
                            {wall.wall_code}
                          </span>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              wall.status === 'active'
                                ? 'bg-green-500/10 text-green-400'
                                : wall.status === 'under_maintenance'
                                  ? 'bg-orange-500/10 text-orange-400'
                                  : wall.status === 'removed'
                                    ? 'bg-red-500/10 text-red-400'
                                    : 'bg-gray-500/10 text-gray-400'
                            }`}
                          >
                            {statusLabels[wall.status] ?? wall.status}
                          </span>
                        </div>

                        <h3 className="mt-3 text-base font-semibold">
                          {wall.name}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                          {location && (
                            <span className="flex items-center gap-1.5">
                              <MapPin size={14} />
                              {location}
                            </span>
                          )}

                          {wall.wall_type && (
                            <span className="flex items-center gap-1.5">
                              <Building2 size={14} />
                              {wall.wall_type}
                            </span>
                          )}

                          {wall.width_m !== null &&
                            wall.height_m !== null && (
                              <span className="flex items-center gap-1.5">
                                <Ruler size={14} />
                                {wall.width_m}m × {wall.height_m}m
                              </span>
                            )}
                        </div>

                        {projectNames.length > 0 ? (
                          <p className="mt-3 text-xs text-gray-400">
                            Active projects:{' '}
                            <span className="text-[#E7FF3C]">
                              {projectNames.join(', ')}
                            </span>
                          </p>
                        ) : (
                          wall.status === 'active' && (
                            <p className="mt-3 text-xs text-gray-500">
                              Not currently assigned to an active project
                            </p>
                          )
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-3">
                        <Link
                          href={`/dashboard/map?wall=${wall.id}`}
                          className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-gray-300 transition hover:border-[#E7FF3C] hover:text-[#E7FF3C]"
                        >
                          View on Map
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs text-gray-600">
            <RefreshCw size={13} />
            Wall information is loaded directly from your database.
          </div>
        </main>
      </div>
    </div>
  )
}

export default function WallsPage(props: WallsPageProps) {
  return (
    <Suspense fallback={<WallsLoading />}>
      <WallsContent searchParams={props.searchParams} />
    </Suspense>
  )
}
