
import Link from 'next/link'
import {
  LayoutDashboard,
  Map,
  PanelsTopLeft,
  BriefcaseBusiness,
  ClipboardCheck,
  Users,
  Settings,
  MapPin,
} from 'lucide-react'

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
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-white/10 bg-[#171717] px-5 py-6">
      <div className="mb-12 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E7FF3C] font-black text-black">
          MK
        </div>

        <div>
          <h1 className="text-sm font-black tracking-wide text-white">
            MEDIA KRATE
          </h1>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.25em] text-[#E7FF3C]">
            WALLTRACK
          </p>
        </div>
      </div>

      <p className="mb-4 px-3 text-[10px] font-bold tracking-[0.2em] text-gray-500">
        WORKSPACE
      </p>

      <nav className="flex-1 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-gray-400 transition hover:bg-white/5 hover:text-white"
            >
              <Icon size={18} />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      <div className="rounded-xl border border-white/10 bg-[#202020] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <MapPin size={15} className="text-[#E7FF3C]" />
          Wall Tracking System
        </div>
        <p className="mt-2 text-[11px] leading-5 text-gray-500">
          Manage advertising locations, projects and field operations.
        </p>
      </div>

      <p className="mt-6 text-center text-[10px] text-gray-600">
        © 2026 The Media Krate
      </p>
    </aside>
  )
}
