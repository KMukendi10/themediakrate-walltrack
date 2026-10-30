
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FolderPlus, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Client = {
  id: string
  name: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()

  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    project_name: '',
    client_id: '',
    description: '',
    status: 'planning',
    start_date: '',
    end_date: '',
  })

  useEffect(() => {
    async function loadClients() {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('Client loading error:', error.message)
        setError('Unable to load clients. You can still create a project without selecting one.')
      } else {
        setClients(data ?? [])
      }

      setLoadingClients(false)
    }

    loadClients()
  }, [supabase])

  function updateField(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.project_name.trim()) {
      setError('Please enter a project name.')
      return
    }

    if (
      form.start_date &&
      form.end_date &&
      form.end_date < form.start_date
    ) {
      setError('The end date cannot be earlier than the start date.')
      return
    }

    setSaving(true)

    const { error: insertError } = await supabase
      .from('projects')
      .insert({
        project_name: form.project_name.trim(),
        client_id: form.client_id || null,
        description: form.description.trim() || null,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      })

    if (insertError) {
      console.error('Project creation error:', insertError.message)
      setError('Unable to create project. Please check the details and try again.')
      setSaving(false)
      return
    }

    router.push('/dashboard/projects?success=Project created successfully')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#111111] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard/projects"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#E7FF3C]"
        >
          <ArrowLeft size={17} />
          Back to Projects
        </Link>

        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7FF3C]/10">
            <FolderPlus size={25} className="text-[#E7FF3C]" />
          </div>

          <h1 className="text-2xl font-bold">Create New Project</h1>
          <p className="mt-2 text-sm text-gray-400">
            Add a new advertising campaign to WallTrack.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-white/10 bg-[#191919] p-5 sm:p-8"
        >
          <section>
            <h2 className="mb-5 text-sm font-semibold text-[#E7FF3C]">
              Project Information
            </h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Project Name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={form.project_name}
                  onChange={(event) => updateField('project_name', event.target.value)}
                  placeholder="e.g. Summer Outdoor Campaign"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none transition focus:border-[#E7FF3C]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Client
                </label>
                <select
                  value={form.client_id}
                  onChange={(event) => updateField('client_id', event.target.value)}
                  disabled={loadingClients}
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none transition focus:border-[#E7FF3C] disabled:opacity-50"
                >
                  <option value="">
                    {loadingClients ? 'Loading clients...' : 'No client selected'}
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {!loadingClients && clients.length === 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    No clients are registered yet. You can add one later.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                  placeholder="Describe the campaign and its objectives..."
                  className="w-full resize-y rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none transition focus:border-[#E7FF3C]"
                />
              </div>
            </div>
          </section>

          <div className="border-t border-white/10" />

          <section>
            <h2 className="mb-5 text-sm font-semibold text-[#E7FF3C]">
              Project Status
            </h2>

            <div>
              <label className="mb-2 block text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(event) => updateField('status', event.target.value)}
                className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </section>

          <div className="border-t border-white/10" />

          <section>
            <h2 className="mb-5 text-sm font-semibold text-[#E7FF3C]">
              Project Timeline
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(event) => updateField('start_date', event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#E7FF3C]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">End Date</label>
                <input
                  type="date"
                  min={form.start_date || undefined}
                  value={form.end_date}
                  onChange={(event) => updateField('end_date', event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#E7FF3C]"
                />
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 border-t border-white/10 pt-6 sm:flex-row">
            <Link
              href="/dashboard/projects"
              className="rounded-lg border border-white/10 px-5 py-3 text-center text-sm font-medium text-gray-300 transition hover:bg-white/5"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || loadingClients}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#E7FF3C] px-6 py-3 text-sm font-semibold text-black transition hover:bg-[#d6ed32] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={17} />
              {saving ? 'Creating Project...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
