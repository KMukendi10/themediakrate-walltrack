
import { Suspense } from 'react'
import { connection } from 'next/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  FolderKanban,
  Plus,
  Search,
  CalendarDays,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CircleAlert,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

type Project = {
  id: string
  project_name: string
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
  created_at: string
}

function formatDate(date: string | null) {
  if (!date) return 'Not set'

  return new Date(`${date}T00:00:00`).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusStyle(status: string) {
  switch (status) {
    case 'active':
      return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'completed':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'planning':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    case 'cancelled':
      return 'bg-red-500/10 text-red-400 border-red-500/20'
    default:
      return 'bg-white/5 text-gray-400 border-white/10'
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ElementType
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#191919] p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-400">{label}</p>
        <Icon size={19} className="text-[#E7FF3C]" />
      </div>
      <p className="text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}

function ProjectsPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-gray-400">
      Loading projects...
    </div>
  )
}

async function ProjectsContent({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>
}) {
  await connection()

  const params = await searchParams
  const searchTerm = params.search?.trim() ?? ''
  const selectedStatus = params.status ?? 'all'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('projects')
    .select('id, project_name, description, status, start_date, end_date, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Projects loading error:', error.message)
  }

  const projects: Project[] = data ?? []

  const totalProjects = projects.length
  const planningProjects = projects.filter((project) => project.status === 'planning').length
  const activeProjects = projects.filter((project) => project.status === 'active').length
  const completedProjects = projects.filter((project) => project.status === 'completed').length

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.description ?? '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      selectedStatus === 'all' || project.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? ''} />

        <main className="p-6 lg:p-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold">Project Management</h1>
              <p className="mt-1 text-sm text-gray-400">
                Manage advertising campaigns and their assigned walls.
              </p>
            </div>

            <Link
              href="/dashboard/projects/new"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d6ed32]"
            >
              <Plus size={18} />
              Create Project
            </Link>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              Unable to load projects. Please refresh the page or try again.
            </div>
          )}

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Projects" value={totalProjects} icon={FolderKanban} />
            <StatCard label="Planning" value={planningProjects} icon={Clock3} />
            <StatCard label="Active" value={activeProjects} icon={BriefcaseBusiness} />
            <StatCard label="Completed" value={completedProjects} icon={CheckCircle2} />
          </div>

          <div className="rounded-xl border border-white/10 bg-[#191919]">
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-semibold">All Projects</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {filteredProjects.length} project(s) found
                </p>
              </div>

              <form className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                  <input
                    type="search"
                    name="search"
                    defaultValue={searchTerm}
                    placeholder="Search projects..."
                    className="w-full rounded-lg border border-white/10 bg-[#111111] py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-[#E7FF3C] sm:w-64"
                  />
                </div>

                <select
                  name="status"
                  defaultValue={selectedStatus}
                  className="rounded-lg border border-white/10 bg-[#111111] px-4 py-2.5 text-sm text-white outline-none focus:border-[#E7FF3C]"
                >
                  <option value="all">All statuses</option>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  type="submit"
                  className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium transition hover:bg-white/5"
                >
                  Apply
                </button>
              </form>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <div className="mb-4 rounded-full bg-white/5 p-4">
                  <FolderKanban size={28} className="text-gray-500" />
                </div>

                <h3 className="font-semibold">No projects found</h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500">
                  {projects.length === 0
                    ? 'There are no projects registered yet. Create your first project to get started.'
                    : 'Try changing your search term or status filter.'}
                </p>

                {projects.length === 0 && (
                  <Link
                    href="/dashboard/projects/new"
                    className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#E7FF3C] px-4 py-2.5 text-sm font-semibold text-black hover:bg-[#d6ed32]"
                  >
                    <Plus size={16} />
                    Create First Project
                  </Link>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h3 className="font-semibold text-white">
                          {project.project_name}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-[11px] font-medium capitalize ${getStatusStyle(project.status)}`}
                        >
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="mb-3 max-w-2xl text-sm text-gray-400">
                        {project.description || 'No description provided.'}
                      </p>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={14} />
                          Start: {formatDate(project.start_date)}
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <CalendarDays size={14} />
                          End: {formatDate(project.end_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/projects/${project.id}`}
                        className="rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-gray-300 transition hover:border-[#E7FF3C] hover:text-[#E7FF3C]"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>
}) {
  return (
    <Suspense fallback={<ProjectsPageSkeleton />}>
      <ProjectsContent searchParams={searchParams} />
    </Suspense>
  )
}
