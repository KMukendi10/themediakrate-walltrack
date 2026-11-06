'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

type Props = {
  wallId: string
}

export default function DeleteWallButton({ wallId }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function deleteWall() {
    if (
      !window.confirm(
        'Permanently delete this wall, its project assignments, all inspection history, and inspection photos? This cannot be undone.'
      )
    ) {
      return
    }

    setDeleting(true)
    setError('')
    try {
      const response = await fetch(`/api/walls/${wallId}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error ?? 'Unable to delete this wall.')
      }
      router.push('/dashboard/walls')
      router.refresh()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Unable to delete this wall. Please try again.'
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={deleteWall}
        disabled={deleting}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={17} />
        {deleting ? 'Deleting...' : 'Delete Wall'}
      </button>
      {error && <p role="alert" className="mt-2 max-w-xs text-xs text-red-400">{error}</p>}
    </div>
  )
}
