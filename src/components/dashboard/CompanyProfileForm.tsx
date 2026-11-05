'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'

type CompanySettings = {
  company_name: string
  company_email: string | null
  contact_number: string | null
  website: string | null
  physical_address: string | null
  description: string | null
}

export default function CompanyProfileForm({
  settings,
}: {
  settings: CompanySettings
}) {
  const router = useRouter()

  const [form, setForm] = useState({
    company_name: settings.company_name || '',
    company_email: settings.company_email || '',
    contact_number: settings.contact_number || '',
    website: settings.website || '',
    physical_address: settings.physical_address || '',
    description: settings.description || '',
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleChange = (
    field: keyof typeof form,
    value: string
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update company profile.')
      }

      setMessage('Company profile updated successfully.')
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      )
    } finally {
      setSaving(false)
    }
  }

  const inputClass =
    'mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#E7FF3C]/50'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[#181818] p-6">
        <h2 className="text-lg font-semibold">
          Company Information
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Update the official company details used in WallTrack.
        </p>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-300">
              Company Name *
            </label>
            <input
              required
              maxLength={150}
              value={form.company_name}
              onChange={(e) =>
                handleChange('company_name', e.target.value)
              }
              className={inputClass}
              placeholder="The Media Krate"
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Company Email
              </label>
              <input
                type="email"
                maxLength={254}
                value={form.company_email}
                onChange={(e) =>
                  handleChange('company_email', e.target.value)
                }
                className={inputClass}
                placeholder="company@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">
                Contact Number
              </label>
              <input
                type="tel"
                maxLength={30}
                value={form.contact_number}
                onChange={(e) =>
                  handleChange('contact_number', e.target.value)
                }
                className={inputClass}
                placeholder="+27 ..."
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">
              Website
            </label>
            <input
              type="url"
              maxLength={255}
              value={form.website}
              onChange={(e) =>
                handleChange('website', e.target.value)
              }
              className={inputClass}
              placeholder="https://www.example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">
              Physical Address
            </label>
            <textarea
              rows={3}
              maxLength={1000}
              value={form.physical_address}
              onChange={(e) =>
                handleChange('physical_address', e.target.value)
              }
              className={inputClass}
              placeholder="Enter the company address"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-300">
              Company Description
            </label>
            <textarea
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(e) =>
                handleChange('description', e.target.value)
              }
              className={inputClass}
              placeholder="Briefly describe the company..."
            />
          </div>
        </div>
      </div>

      {message && (
        <p className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
          {message}
        </p>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d5ed32] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
