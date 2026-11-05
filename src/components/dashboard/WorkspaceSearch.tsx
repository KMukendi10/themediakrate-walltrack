'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

type SearchResult = {
  id: string
  type: string
  title: string
  detail: string
  href: string
}

export default function WorkspaceSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        rootRef.current?.querySelector('input')?.focus()
        setOpen(true)
      }

      if (event.key === 'Escape') setOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) return

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(term)}`,
          { signal: controller.signal }
        )
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error ?? 'Search is unavailable.')
        }
        setResults(result.results)
      } catch (requestError) {
        if (controller.signal.aborted) return
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Search is unavailable.'
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 250)

    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [query])

  return (
    <div ref={rootRef} className="relative hidden w-72 md:block">
      <label className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#202020] px-4 py-2">
        <Search size={16} className="shrink-0 text-gray-500" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setResults([])
            setError('')
            setLoading(false)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={(event) => {
            if (!rootRef.current?.contains(event.relatedTarget)) {
              window.setTimeout(() => setOpen(false), 120)
            }
          }}
          maxLength={80}
          placeholder="Search walls, projects, clients..."
          aria-label="Search workspace"
          aria-controls="workspace-search-results"
          className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-500"
        />
        <kbd className="rounded bg-white/10 px-2 py-1 text-[10px] text-gray-400">
          Ctrl K
        </kbd>
      </label>

      {open && query.trim().length >= 2 && (
        <div
          id="workspace-search-results"
          className="absolute right-0 top-full z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#1B1B1B] p-2 shadow-2xl"
        >
          {loading ? (
            <p className="p-3 text-sm text-gray-400">Searching...</p>
          ) : error ? (
            <p role="alert" className="p-3 text-sm text-red-400">
              {error}
            </p>
          ) : results.length === 0 ? (
            <p className="p-3 text-sm text-gray-400">No matching records.</p>
          ) : (
            results.map((result) => (
              <Link
                key={`${result.type}-${result.id}`}
                href={result.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 transition hover:bg-white/5"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[#E7FF3C]">
                  {result.type}
                </span>
                <span className="block truncate text-sm font-medium text-white">
                  {result.title}
                </span>
                <span className="block truncate text-xs capitalize text-gray-500">
                  {result.detail}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}
