
'use client'

import { useState } from 'react'
import { Save, CheckCircle2, AlertCircle } from 'lucide-react'

type Preferences = {
  date_format: string
  timezone: string
  default_dashboard_page: string
  email_notifications: boolean
}

type Props = {
  initialPreferences: Preferences | null
}

export default function SystemPreferencesForm({
  initialPreferences,
}: Props) {
  const [dateFormat, setDateFormat] = useState(
    initialPreferences?.date_format ?? 'DD/MM/YYYY'
  )

  const [timezone, setTimezone] = useState(
    initialPreferences?.timezone ?? 'Africa/Johannesburg'
  )

  const [dashboardPage, setDashboardPage] = useState(
    initialPreferences?.default_dashboard_page ?? '/dashboard'
  )

  const [emailNotifications, setEmailNotifications] = useState(
    initialPreferences?.email_notifications ?? true
  )

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date_format: dateFormat,
          timezone,
          default_dashboard_page: dashboardPage,
          email_notifications: emailNotifications,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Could not save preferences.')
      }

      setMessage('Your preferences have been saved successfully.')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving.'
      )
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition focus:border-[#E7FF3C]/50'

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-white/10 bg-[#181818] p-6"
    >
      <div>
        <label className="text-sm font-medium text-gray-200">
          Date Format
        </label>

        <select
          value={dateFormat}
          onChange={(event) => setDateFormat(event.target.value)}
          className={inputClass}
        >
          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
          <option value="MM/DD/YYYY">MM/DD/YYYY</option>
        </select>

        <p className="mt-2 text-xs text-gray-500">
          Choose how dates should be displayed.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-200">
          Time Zone
        </label>

        <select
          value={timezone}
          onChange={(event) => setTimezone(event.target.value)}
          className={inputClass}
        >
          <option value="Africa/Johannesburg">
            South Africa (Johannesburg)
          </option>
          <option value="UTC">
            UTC
          </option>
          <option value="Europe/London">
            United Kingdom (London)
          </option>
          <option value="America/New_York">
            United States (New York)
          </option>
          <option value="America/Los_Angeles">
            United States (Los Angeles)
          </option>
          <option value="Asia/Dubai">
            United Arab Emirates (Dubai)
          </option>
        </select>

        <p className="mt-2 text-xs text-gray-500">
          Select your preferred time zone.
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-200">
          Default Dashboard Page
        </label>

        <select
          value={dashboardPage}
          onChange={(event) => setDashboardPage(event.target.value)}
          className={inputClass}
        >
          <option value="/dashboard">Overview</option>
          <option value="/dashboard/walls">Wall Management</option>
          <option value="/dashboard/map">Wall Map</option>
          <option value="/dashboard/projects">Projects</option>
          <option value="/dashboard/inspections">Inspections</option>
        </select>

        <p className="mt-2 text-xs text-gray-500">
          Choose which page you prefer as your starting point.
        </p>
      </div>

      <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-[#111111] p-4">
        <div>
          <h3 className="text-sm font-medium">
            Email Notifications
          </h3>

          <p className="mt-1 text-xs text-gray-500">
            Enable or disable application email notifications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEmailNotifications(!emailNotifications)}
          aria-pressed={emailNotifications}
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            emailNotifications ? 'bg-[#E7FF3C]' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full transition ${
              emailNotifications
                ? 'left-6 bg-black'
                : 'left-1 bg-white'
            }`}
          />
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
          <CheckCircle2 size={17} />
          {message}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle size={17} />
          {error}
        </div>
      )}

      <div className="flex justify-end border-t border-white/10 pt-5">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d9f52f] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={17} />
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </form>
  )
}
