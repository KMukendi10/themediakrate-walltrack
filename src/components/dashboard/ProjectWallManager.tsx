'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Wall = {
  id: string
  wall_code: string
  name: string
  address: string | null
  suburb: string | null
  city: string | null
  status: string
}

type Assignment = {
  id: string
  installation_date: string | null
  completion_date: string | null
  notes: string | null
  wall: Wall | null
}

type Props = {
  projectId: string
  initialAssignments: Assignment[]
}

export default function ProjectWallManager({
  projectId,
  initialAssignments,
}: Props) {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [walls, setWalls] = useState<Wall[]>([])
  const [selectedWall, setSelectedWall] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadWalls() {
      const { data, error } = await supabase
        .from('walls')
        .select('id, wall_code, name, address, suburb, city, status')
        .neq('status', 'removed')
        .order('wall_code')

      if (error) {
        setMessage('Unable to load available walls.')
        setLoading(false)
        return
      }

      setWalls(data ?? [])
      setLoading(false)
    }

    loadWalls()
  }, [supabase])

  const assignedWallIds = initialAssignments
    .map((assignment) => assignment.wall?.id)
    .filter(Boolean)

  const availableWalls = walls.filter(
    (wall) => !assignedWallIds.includes(wall.id)
  )

  async function assignWall() {
    if (!selectedWall) {
      setMessage('Please select a wall first.')
      return
    }

    setSaving(true)
    setMessage('')

    const { error } = await supabase.from('wall_projects').insert({
      wall_id: selectedWall,
      project_id: projectId,
    })

    if (error) {
      console.error('Wall assignment error:', error)
      setMessage('Unable to assign this wall. Please try again.')
      setSaving(false)
      return
    }

    setSelectedWall('')
    setMessage('Wall assigned successfully.')
    setSaving(false)

    router.refresh()
  }

  async function removeWall(assignmentId: string) {
    const confirmed = window.confirm(
      'Are you sure you want to remove this wall from the project?'
    )

    if (!confirmed) return

    setRemovingId(assignmentId)
    setMessage('')

    const { error } = await supabase
      .from('wall_projects')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      console.error('Wall removal error:', error)
      setMessage('Unable to remove this wall. Please try again.')
      setRemovingId('')
      return
    }

    setMessage('Wall removed successfully.')
    setRemovingId('')

    router.refresh()
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[#1b1b1b] p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Assigned Advertising Walls
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Manage the physical locations linked to this project.
          </p>
        </div>

        <span className="rounded-lg bg-white/5 px-3 py-2 text-sm text-gray-300">
          {initialAssignments.length} walls
        </span>
      </div>

      <div className="mb-6 rounded-lg border border-white/10 bg-[#151515] p-4">
        <h3 className="mb-3 text-sm font-semibold">Assign a Wall</h3>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            value={selectedWall}
            onChange={(event) => setSelectedWall(event.target.value)}
            disabled={loading || saving || availableWalls.length === 0}
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#202020] px-4 py-3 text-sm text-white outline-none focus:border-[#E7FF3C] disabled:opacity-50"
          >
            <option value="">
              {loading
                ? 'Loading available walls...'
                : availableWalls.length === 0
                  ? 'No available walls'
                  : 'Select an advertising wall'}
            </option>

            {availableWalls.map((wall) => (
              <option key={wall.id} value={wall.id}>
                {wall.wall_code} — {wall.name}
                {wall.city ? ` (${wall.city})` : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={assignWall}
            disabled={!selectedWall || saving || loading}
            className="rounded-lg bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Assigning...' : 'Assign Wall'}
          </button>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Only walls that are not already assigned to this project are shown.
        </p>
      </div>

      {message && (
        <p className="mb-4 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
          {message}
        </p>
      )}

      {initialAssignments.length > 0 ? (
        <div className="space-y-3">
          {initialAssignments.map((assignment) => {
            const wall = assignment.wall

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

                <div className="flex items-center gap-2">
                  <a
                    href={`/dashboard/walls/${wall.id}`}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm transition hover:border-yellow-400 hover:text-yellow-400"
                  >
                    View Wall
                  </a>

                  <button
                    type="button"
                    onClick={() => removeWall(assignment.id)}
                    disabled={removingId === assignment.id}
                    className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {removingId === assignment.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
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
  )
}
