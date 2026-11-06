
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Menu, UserCircle } from 'lucide-react'
import WorkspaceSearch from './WorkspaceSearch'
import RecentUpdates from './RecentUpdates'
import { NAVIGATION_TOGGLE_EVENT } from './navigation-events'

type TopbarProps = {
  email: string
}

export default function Topbar({ email }: TopbarProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)

  function toggleNavigation() {
    window.dispatchEvent(new Event(NAVIGATION_TOGGLE_EVENT))
  }

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !accountMenuRef.current?.contains(event.target)
      ) {
        setAccountMenuOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAccountMenuOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-[#171717]/95 px-4 backdrop-blur md:h-20 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Toggle navigation menu"
          onClick={toggleNavigation}
          className="rounded-full p-2 text-gray-400 transition hover:bg-white/10 hover:text-white md:hidden"
        >
          <Menu size={21} />
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold text-white md:mt-1 md:text-lg">
            WallTrack Dashboard
          </h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-6">
        <div className="hidden sm:block">
          <WorkspaceSearch />
        </div>
        <RecentUpdates />

        <div
          ref={accountMenuRef}
          className="relative border-l border-white/10 pl-3 md:pl-6"
        >
          <button
            type="button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
            onClick={() => setAccountMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#E7FF3C] transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E7FF3C]"
          >
            <UserCircle size={26} />
          </button>

          {accountMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-xl border border-white/10 bg-[#1B1B1B] p-2 shadow-2xl"
            >
              <div className="border-b border-white/10 px-3 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                  Signed in
                </p>
                <p className="mt-1 truncate text-sm font-medium text-white">
                  {email}
                </p>
              </div>
              <Link
                href="/dashboard/settings/preferences"
                role="menuitem"
                onClick={() => setAccountMenuOpen(false)}
                className="mt-2 block rounded-lg px-3 py-2.5 text-sm text-gray-300 transition hover:bg-white/[0.07] hover:text-[#E7FF3C]"
              >
                Account preferences
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
