
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function AddEmployeeForm() {
  const router = useRouter()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to invite employee.')
      }

      setSuccess('Employee invitation sent successfully.')

      setFullName('')
      setEmail('')

      setTimeout(() => {
        router.push('/dashboard/employees')
        router.refresh()
      }, 1800)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/employees"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#E7FF3C]"
      >
        <ArrowLeft size={16} />
        Back to Employees
      </Link>

      <div className="rounded-2xl border border-white/10 bg-[#1B1B1B] p-6 sm:p-8">
        <div className="mb-8 flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7FF3C]/10 text-[#E7FF3C]">
            <UserPlus size={24} />
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">
              Employee Information
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Enter the employee&apos;s details to send an account invitation.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Full Name
            </label>

            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter employee's full name"
              maxLength={100}
              required
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#E7FF3C]"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-300"
            >
              Email Address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="employee@example.com"
              maxLength={254}
              required
              disabled={loading}
              className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#E7FF3C]"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111111] p-4">
            <p className="text-sm font-medium text-white">
              Account invitation
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              The employee will receive an email invitation to set up their
              account. Their account will automatically be assigned the
              Employee role.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/employees"
              className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-medium text-gray-300 transition hover:bg-white/5"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d7ef30] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
