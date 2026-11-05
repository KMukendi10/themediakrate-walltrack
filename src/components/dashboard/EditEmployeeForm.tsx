
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'

type EditEmployeeFormProps = {
  employee: {
    id: string
    full_name: string
    email: string
    role: string
  }
}

export default function EditEmployeeForm({
  employee,
}: EditEmployeeFormProps) {
  const router = useRouter()

  const [fullName, setFullName] = useState(employee.full_name)
  const [email, setEmail] = useState(employee.email)
  const [role, setRole] = useState(employee.role)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/employees', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: employee.id,
          full_name: fullName,
          email,
          role,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Unable to update employee.')
      }

      setSuccess('Employee details updated successfully.')

      router.refresh()

      setTimeout(() => {
        router.push(`/dashboard/employees/${employee.id}`)
      }, 1200)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Full Name
        </label>

        <input
          type="text"
          required
          maxLength={100}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-white outline-none transition focus:border-[#E7FF3C]"
          placeholder="Enter employee's full name"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Email Address
        </label>

        <input
          type="email"
          required
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-white outline-none transition focus:border-[#E7FF3C]"
          placeholder="Enter employee's email address"
        />

        <p className="mt-2 text-xs text-gray-500">
          Updating this address also updates the employee's login email.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">
          Account Role
        </label>

        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-[#181818] px-4 py-3 text-white outline-none transition focus:border-[#E7FF3C]"
        >
          <option value="employee">Employee</option>
          <option value="admin">Administrator</option>
        </select>

        <p className="mt-2 text-xs text-gray-500">
          Administrators have access to employee management and other restricted areas.
        </p>
      </div>

      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
        <p className="text-sm text-yellow-400">
          Please double-check the new email address. It will be used
          for the employee's account login.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-[#E7FF3C]/20 bg-[#E7FF3C]/10 p-4 text-sm text-[#E7FF3C]">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !fullName.trim() || !email.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#E7FF3C] px-5 py-3 font-semibold text-black transition hover:bg-[#d6ee32] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}

        {loading ? 'Saving Changes...' : 'Save Changes'}
      </button>
    </form>
  )
}
