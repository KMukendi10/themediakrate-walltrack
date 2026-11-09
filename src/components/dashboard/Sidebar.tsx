
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Map,
  PanelsTopLeft,
  BriefcaseBusiness,
  ClipboardCheck,
  Users,
  Settings,
  MapPin,
  X,
} from 'lucide-react'
import { NAVIGATION_TOGGLE_EVENT } from './navigation-events'

const navigation = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Wall Management',
    href: '/dashboard/walls',
    icon: PanelsTopLeft,
  },
  {
    title: 'Wall Map',
    href: '/dashboard/map',
    icon: Map,
  },
  {
    title: 'Projects',
    href: '/dashboard/projects',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Inspections',
    href: '/dashboard/inspections',
    icon: ClipboardCheck,
  },
  {
    title: 'Employees',
    href: '/dashboard/employees',
    icon: Users,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    function toggleMobileNavigation() {
      setMobileOpen((open) => !open)
    }

    window.addEventListener(NAVIGATION_TOGGLE_EVENT, toggleMobileNavigation)
    return () =>
      window.removeEventListener(
        NAVIGATION_TOGGLE_EVENT,
        toggleMobileNavigation
      )
  }, [])

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <div className="hidden w-20 shrink-0 md:block" aria-hidden="true" />
      <aside
        className={`walltrack-sidebar-scroll group fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-x-hidden overflow-y-auto border-r border-white/10 bg-[#171717] px-3 py-5 shadow-2xl transition-transform duration-300 ease-in-out md:w-20 md:px-2 md:shadow-none md:transition-[width] md:duration-300 md:ease-in-out md:hover:w-64 md:focus-within:w-64 md:group-hover:delay-150 md:group-focus-within:delay-150 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="mb-9 flex h-12 items-center gap-3 px-2 md:group-hover:px-3 md:group-focus-within:px-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E7FF3C] font-black text-black">
            WT
          </div>
          <div className="overflow-hidden whitespace-nowrap opacity-100 transition-[max-width,opacity] duration-300 md:max-w-0 md:opacity-0 md:group-hover:max-w-40 md:group-hover:opacity-100 md:group-hover:delay-150 md:group-focus-within:max-w-40 md:group-focus-within:opacity-100 md:group-focus-within:delay-150">
            <h1 className="text-sm font-black tracking-wide text-white">
              WallTrack
            </h1>
            <p className="mt-1 text-[10px] font-semibold tracking-[0.25em] text-[#E7FF3C]">
              WALL MANAGEMENT
            </p>
          </div>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' &&
                pathname.startsWith(`${item.href}/`))

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={item.title}
                onClick={() => setMobileOpen(false)}
                className={`group/link flex h-12 w-full items-center gap-3 rounded-full px-4 text-sm transition-[width,padding] duration-300 md:mx-auto md:w-12 md:justify-center md:gap-0 md:px-0 md:group-hover:w-full md:group-hover:justify-start md:group-hover:gap-3 md:group-hover:px-0 md:group-focus-within:w-full md:group-focus-within:justify-start md:group-focus-within:gap-3 md:group-focus-within:px-0 ${
                  active
                    ? 'font-semibold text-[#E7FF3C]'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
                    active
                      ? 'bg-[#E7FF3C]/15 text-[#E7FF3C]'
                      : 'text-gray-400 group-hover/link:bg-white/[0.07] group-hover/link:text-white'
                  }`}
                >
                  <Icon size={20} />
                </span>
                <span className="whitespace-nowrap md:max-w-0 md:overflow-hidden md:opacity-0 md:transition-[max-width,opacity] md:duration-300 md:group-hover:max-w-40 md:group-hover:opacity-100 md:group-hover:delay-150 md:group-focus-within:max-w-40 md:group-focus-within:opacity-100 md:group-focus-within:delay-150">
                  {item.title}
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-6 hidden rounded-2xl border border-white/10 bg-[#202020] p-4 opacity-0 transition-opacity duration-300 md:block md:group-hover:opacity-100 md:group-hover:delay-150 md:group-focus-within:opacity-100 md:group-focus-within:delay-150">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <MapPin size={15} className="text-[#E7FF3C]" />
            Wall Tracking System
          </div>
          <p className="mt-2 text-[11px] leading-5 text-gray-500">
            Manage advertising locations, projects and field operations.
          </p>
        </div>

        <p className="mt-5 hidden text-center text-[10px] text-gray-600 md:group-hover:block md:group-focus-within:block">
          WallTrack · Prototype
        </p>
      </aside>
    </>
  )
}
