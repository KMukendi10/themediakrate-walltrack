'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

type Props = {
  inspectionId: string
}

export default function DeleteInspectionButton({ inspectionId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function deleteInspection() {
    if (
      !window.confirm(
        'Permanently delete this inspection and its uploaded photos? This cannot be undone.'
      )
    ) {
      return
    }

    setDeleting(true)
    setError('')
    try {
      const response = await fetch(`/api/inspections/${inspectionId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to delete this inspection.')
      }
      router.push('/dashboard/inspections')
      router.refresh()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to delete this inspection. Please try again.'
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={deleteInspection}
        disabled={deleting}
        className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={16} />
        {deleting ? 'Deleting...' : 'Delete Inspection'}
      </button>
      {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
