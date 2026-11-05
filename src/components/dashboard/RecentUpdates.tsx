'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell } from 'lucide-react'
import {
  DEFAULT_DATE_PREFERENCES,
  formatAppDate,
  type DateDisplayPreferences,
} from '@/lib/date-format'

type Update = {
  id: string
  title: string
  detail: string
  href: string
  createdAt: string
}

export default function RecentUpdates() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [updates, setUpdates] = useState<Update[]>([])
  const [datePreferences, setDatePreferences] =
    useState<DateDisplayPreferences>(DEFAULT_DATE_PREFERENCES)

  async function toggleUpdates() {
    if (open) {
      setOpen(false)
      return
    }

    setOpen(true)
    if (updates.length > 0) return

    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/notifications')
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to load recent updates.')
      }
      setUpdates(result.results)
      setDatePreferences(
        result.datePreferences ?? DEFAULT_DATE_PREFERENCES
      )
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to load recent updates.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleUpdates}
        className="text-gray-400 transition hover:text-white"
        aria-label="Recent inspection updates"
        aria-expanded={open}
      >
        <Bell size={19} />
      </button>

      {open && (
        <section className="absolute right-0 top-full z-50 mt-4 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-white/10 bg-[#1B1B1B] p-3 shadow-2xl">
          <h3 className="px-2 py-1 text-sm font-semibold text-white">
            Recent inspections
          </h3>
          <p className="px-2 pb-2 text-xs text-gray-500">
            Latest records; unread status is not tracked.
          </p>
          {loading ? (
            <p className="p-3 text-sm text-gray-400">Loading updates...</p>
          ) : error ? (
            <p role="alert" className="p-3 text-sm text-red-400">
              {error}
            </p>
          ) : updates.length === 0 ? (
            <p className="p-3 text-sm text-gray-400">
              No inspection records yet.
            </p>
          ) : (
            <div className="max-h-80 divide-y divide-white/5 overflow-y-auto">
              {updates.map((update) => (
                <Link
                  key={update.id}
                  href={update.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-3 hover:bg-white/5"
                >
                  <span className="block truncate text-sm text-white">
                    {update.title}
                  </span>
                  <span className="block text-xs capitalize text-gray-400">
                    {update.detail}
                  </span>
                  <time className="mt-1 block text-[10px] text-gray-500">
                    {formatAppDate(
                      update.createdAt,
                      datePreferences,
                      true
                    )}
                  </time>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
