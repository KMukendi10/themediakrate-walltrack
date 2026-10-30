
import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

type ProjectPageProps = {
  params: Promise<{ id: string }>
}

async function ProjectDetailsContent({ params }: ProjectPageProps) {
  await connection()

  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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

  const client = Array.isArray(project.client)
    ? project.client[0]
    : project.client

  const walls = assignments ?? []

  const statusStyles: Record<string, string> = {
    planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    active: 'bg-green-500/10 text-green-400 border-green-500/20',
    completed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Not set'

    return new Date(`${date}T00:00:00`).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
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

              <h1 className="mt-3 text-3xl font-bold">
                {project.project_name}
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Project details and assigned advertising walls
              </p>
            </div>

            <span
              className={`rounded-full border px-4 py-2 text-sm font-medium capitalize ${
                statusStyles[project.status] ??
                'bg-gray-500/10 text-gray-400 border-gray-500/20'
              }`}
            >
              {project.status.replace('_', ' ')}
            </span>
          </div>

          <section className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-5">
              <p className="text-sm text-gray-400">Assigned Walls</p>
              <p className="mt-3 text-3xl font-bold">{walls.length}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-5">
              <p className="text-sm text-gray-400">Start Date</p>
              <p className="mt-3 text-xl font-semibold">
                {formatDate(project.start_date)}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1b1b1b] p-5">
              <p className="text-sm text-gray-400">End Date</p>
              <p className="mt-3 text-xl font-semibold">
                {formatDate(project.end_date)}
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
                    {new Date(project.created_at).toLocaleDateString('en-ZA')}
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

          <section className="rounded-xl border border-white/10 bg-[#1b1b1b] p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">
                  Assigned Advertising Walls
                </h2>
                <p className="mt-1 text-sm text-gray-400">
                  Physical locations linked to this project
                </p>
              </div>

              <span className="rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-300">
                {walls.length} walls
              </span>
            </div>

            {walls.length > 0 ? (
              <div className="space-y-3">
                {walls.map((assignment: any) => {
                  const wall = Array.isArray(assignment.wall)
                    ? assignment.wall[0]
                    : assignment.wall

                  if (!wall) return null

                  return (
                    <div
                      key={assignment.id}
                      className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 p-4"
                    >
                      <div>
                        <p className="font-medium">{wall.name}</p>
                        <p className="mt-1 text-xs text-yellow-400">
                          {wall.wall_code}
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                          {[wall.address, wall.suburb, wall.city]
                            .filter(Boolean)
                            .join(', ') || 'No address provided'}
                        </p>
                        <p className="mt-1 text-xs capitalize text-gray-500">
                          Wall status: {wall.status.replace('_', ' ')}
                        </p>
                      </div>

                      <Link
                        href={`/dashboard/walls/${wall.id}`}
                        className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:border-yellow-400 hover:text-yellow-400"
                      >
                        View Wall →
                      </Link>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/10 py-12 text-center">
                <p className="text-gray-400">
                  No walls have been assigned to this project yet.
                </p>
              </div>
            )}
          </section>
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
