'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

type Client = {
  id: string
  name: string
}

type Project = {
  id: string
  project_name: string
  client_id: string | null
  description: string | null
  status: string
  start_date: string | null
  end_date: string | null
}

type Props = {
  projectId: string
}

export default function EditProjectForm({ projectId }: Props) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [userEmail, setUserEmail] = useState('')
  const [project, setProject] = useState<Project | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    project_name: '',
    client_id: '',
    description: '',
    status: 'planning',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserEmail(user.email ?? '')

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError || profile?.role !== 'admin') {
        setError('You do not have permission to edit projects.')
        setLoading(false)
        return
      }

      const [projectResult, clientsResult] = await Promise.all([
        supabase
          .from('projects')
          .select(
            'id, project_name, client_id, description, status, start_date, end_date'
          )
          .eq('id', projectId)
          .single(),

        supabase
          .from('clients')
          .select('id, name')
          .order('name'),
      ])

      if (projectResult.error || !projectResult.data) {
        setError('Unable to load this project.')
        setLoading(false)
        return
      }

      if (clientsResult.error) {
        setError('Unable to load clients. Please refresh the page.')
        setLoading(false)
        return
      }

      const currentProject = projectResult.data as Project

      setProject(currentProject)
      setClients(clientsResult.data ?? [])

      setFormData({
        project_name: currentProject.project_name ?? '',
        client_id: currentProject.client_id ?? '',
        description: currentProject.description ?? '',
        status: currentProject.status ?? 'planning',
        start_date: currentProject.start_date ?? '',
        end_date: currentProject.end_date ?? '',
      })

      setLoading(false)
    }

    loadData()
  }, [projectId, router, supabase])

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!project) return

    if (!formData.project_name.trim()) {
      setError('Please enter a project name.')
      return
    }

    if (
      formData.start_date &&
      formData.end_date &&
      formData.end_date < formData.start_date
    ) {
      setError('The end date cannot be earlier than the start date.')
      return
    }

    setSaving(true)

    const { error: updateError } = await supabase
      .from('projects')
      .update({
        project_name: formData.project_name.trim(),
        client_id: formData.client_id || null,
        description: formData.description.trim() || null,
        status: formData.status,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      })
      .eq('id', project.id)

    if (updateError) {
      console.error('Project update error:', updateError)
      setError('Unable to update project. Please try again.')
      setSaving(false)
      return
    }

    router.push(`/dashboard/projects/${project.id}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#111111] text-white">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Topbar email={userEmail} />
          <div className="p-8 text-gray-400">Loading project...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <main className="min-w-0 flex-1">
        <Topbar email={userEmail} />

        <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-8">
          <div>
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="text-sm text-gray-400 hover:text-[#E7FF3C]"
            >
              ← Back to Project
            </Link>

            <h1 className="mt-5 text-3xl font-bold">Edit Project</h1>

            <p className="mt-2 text-sm text-gray-400">
              Update the project details below.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {project && (
            <form
              onSubmit={handleSubmit}
              className="space-y-6 rounded-xl border border-white/10 bg-[#191919] p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Project Name *
                </label>

                <input
                  type="text"
                  name="project_name"
                  value={formData.project_name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none focus:border-[#E7FF3C]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Client
                </label>

                <select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none focus:border-[#E7FF3C]"
                >
                  <option value="">No client selected</option>

                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Description
                </label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none focus:border-[#E7FF3C]"
                  placeholder="Describe the project..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Project Status
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none focus:border-[#E7FF3C]"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Start Date
                  </label>

                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none focus:border-[#E7FF3C]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    End Date
                  </label>

                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none focus:border-[#E7FF3C]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
                <Link
                  href={`/dashboard/projects/${projectId}`}
                  className="rounded-lg border border-white/10 px-6 py-3 text-center text-sm font-semibold text-gray-300 transition hover:bg-white/5"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#E7FF3C] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#d5ed25] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {!project && !error && (
            <p className="text-gray-400">Project not found.</p>
          )}
        </div>
      </main>
    </div>
  )
}