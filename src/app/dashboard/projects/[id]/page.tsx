
import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import ProjectWallManager from '@/components/dashboard/ProjectWallManager'
import DeleteProjectButton from '@/components/dashboard/DeleteProjectButton'
import { getUserDatePreferences } from '@/lib/user-date-preferences'
import { formatAppDate } from '@/lib/date-format'

type ProjectPageProps = {
  params: Promise<{ id: string }>
}

type ProjectWall = {
  id: string
  installation_date: string | null
  completion_date: string | null
  notes: string | null
  wall: {
    id: string
    wall_code: string
    name: string
    address: string | null
    suburb: string | null
    city: string | null
    status: string
  } | {
    id: string
    wall_code: string
    name: string
    address: string | null
    suburb: string | null
    city: string | null
    status: string
  }[] | null
}

async function ProjectDetailsContent({ params }: ProjectPageProps) {
  await connection()

  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const datePreferences = await getUserDatePreferences(supabase, user.id)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Project action authorization lookup error:', profileError)
  }
  const isAdmin = profile?.role === 'admin'

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      id,
      project_name,
      description,
      status,
      start_date,
      end_date,
      created_at,
      client:clients (
        id,
        name,
        contact_person,
        email,
        phone,
        address
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    console.error('Project details error:', error)
    return (
      <div className="p-8 text-red-400">
        Unable to load project details. {error.message}
      </div>
    )
  }

  if (!project) notFound()

  const { data: assignments, error: assignmentsError } = await supabase
    .from('wall_projects')
    .select(`
      id,
      installation_date,
      completion_date,
      notes,
      wall:walls (
        id,
        wall_code,
        name,
        address,
        suburb,
        city,
        status
      )
    `)
    .eq('project_id', id)

  if (assignmentsError) {
    console.error('Project walls error:', assignmentsError)
  }

  const projectWalls: ProjectWall[] = assignments ?? []
  const client = Array.isArray(project.client)
    ? project.client[0]
    : project.client

  const walls = projectWalls

  const statusStyles: Record<string, string> = {
    planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <main className="min-h-screen min-w-0 flex-1">
        <Topbar email={user.email ?? ''} />

        <div className="space-y-8 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                href="/dashboard/projects"
                className="text-sm text-gray-400 hover:text-yellow-400"
              >
                ← Back to Projects
              </Link>

              <h1 className="mt-4 text-2xl font-bold">
                {project.project_name}
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Project details and assigned advertising walls
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full border px-4 py-2 text-sm font-medium capitalize ${
                  statusStyles[project.status] ??
                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}
              >
                {project.status.replace('_', ' ')}
              </span>

              <Link
                href={`/dashboard/projects/${project.id}/edit`}
                className="rounded-lg bg-[#E7FF3C] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-yellow-300"
              >
                Edit Project
              </Link>
              {isAdmin && <DeleteProjectButton projectId={project.id} />}
            </div>
          </div>

          <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-5">
              <p className="text-sm text-gray-400">Assigned Walls</p>
              <p className="mt-3 text-3xl font-bold">{walls.length}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-5">
              <p className="text-sm text-gray-400">Start Date</p>
              <p className="mt-3 text-xl font-semibold">
                {formatAppDate(project.start_date, datePreferences) || 'Not set'}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-5">
              <p className="text-sm text-gray-400">End Date</p>
              <p className="mt-3 text-xl font-semibold">
                {formatAppDate(project.end_date, datePreferences) || 'Not set'}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-6">
              <h2 className="mb-5 text-lg font-semibold">
                Project Information
              </h2>

              <div className="space-y-5">
                <div>
                  <p className="text-xs text-gray-500">Project Name</p>
                  <p className="mt-1">{project.project_name}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-gray-300">
                    {project.description || 'No description provided'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="mt-1 capitalize">
                    {project.status.replace('_', ' ')}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Created On</p>
                  <p className="mt-1">
                    {formatAppDate(project.created_at, datePreferences)}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-6">
              <h2 className="mb-5 text-lg font-semibold">
                Client Information
              </h2>

              {client ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-xs text-gray-500">Client Name</p>
                    <p className="mt-1">{client.name}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Contact Person</p>
                    <p className="mt-1">
                      {client.contact_person || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="mt-1">
                      {client.email || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="mt-1">
                      {client.phone || 'Not provided'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Address</p>
                    <p className="mt-1">
                      {client.address || 'Not provided'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  No client has been assigned to this project.
                </p>
              )}
            </div>
          </section>

          <ProjectWallManager
            projectId={project.id}
            initialAssignments={walls.map((assignment) => {
              const wall = Array.isArray(assignment.wall)
                ? assignment.wall[0]
                : assignment.wall

              return {
                id: assignment.id,
                installation_date: assignment.installation_date,
                completion_date: assignment.completion_date,
                notes: assignment.notes,
                wall: wall ?? null,
              }
            })}
          />
        </div>
      </main>
    </div>
  )
}

export default function ProjectDetailsPage(props: ProjectPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] p-8 text-white">
          Loading project details...
        </div>
      }
    >
      <ProjectDetailsContent {...props} />
    </Suspense>
  )
}
