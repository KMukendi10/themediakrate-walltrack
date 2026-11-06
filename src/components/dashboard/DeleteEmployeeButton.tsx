'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

type Props = {
  employeeId: string
}

export default function DeleteEmployeeButton({ employeeId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function deleteEmployee() {
    if (
      !window.confirm(
        'Permanently delete this employee’s sign-in account and profile? Inspection history will remain, but the employee will be removed from its attribution. This cannot be undone.'
      )
    ) {
      return
    }

    setDeleting(true)
    setError('')
    try {
      const response = await fetch(
        `/api/employees?id=${encodeURIComponent(employeeId)}`,
        { method: 'DELETE' }
      )
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to delete this employee.')
      }
      router.push('/dashboard/employees')
      router.refresh()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to delete this employee. Please try again.'
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={deleteEmployee}
        disabled={deleting}
        className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={16} />
        {deleting ? 'Deleting...' : 'Delete Employee'}
      </button>
      {error && <p role="alert" className="mt-2 max-w-sm text-xs text-red-400">{error}</p>}
    </div>
  )
}
