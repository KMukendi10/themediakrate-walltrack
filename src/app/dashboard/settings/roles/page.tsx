
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import {
  ShieldCheck,
  UserRound,
  Users,
  LockKeyhole,
  Eye,
  Settings,
  BriefcaseBusiness,
  PanelsTopLeft,
  ClipboardCheck,
  Map,
  CheckCircle2,
  XCircle,
  ArrowLeft,
} from 'lucide-react'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

const permissions = [
  {
    name: 'Dashboard Overview',
    description: 'View workspace statistics and summaries.',
    icon: PanelsTopLeft,
    admin: true,
    employee: true,
  },
  {
    name: 'Wall Management',
    description: 'Access wall records and location information.',
    icon: PanelsTopLeft,
    admin: true,
    employee: true,
  },
  {
    name: 'Wall Map',
    description: 'View registered advertising locations on the map.',
    icon: Map,
    admin: true,
    employee: true,
  },
  {
    name: 'Project Management',
    description: 'View projects and their assigned advertising walls.',
    icon: BriefcaseBusiness,
    admin: true,
    employee: true,
  },
  {
    name: 'Inspections',
    description: 'Access wall inspection records and information.',
    icon: ClipboardCheck,
    admin: true,
    employee: true,
  },
  {
    name: 'Employee Management',
    description: 'View, invite, update and manage employee accounts.',
    icon: Users,
    admin: true,
    employee: false,
  },
  {
    name: 'Company Settings',
    description: 'Manage company profile and system settings.',
    icon: Settings,
    admin: true,
    employee: false,
  },
  {
    name: 'Account Settings',
    description: 'Manage personal information and password.',
    icon: UserRound,
    admin: true,
    employee: false,
  },
]

function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-gray-400">
      Loading permissions...
    </div>
  )
}

async function RolesContent() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { count: adminCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'admin')

  const { count: employeeCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'employee')

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Admin'} />

        <main className="p-6 lg:p-8">
          <Link
            href="/dashboard/settings"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#E7FF3C]"
          >
            <ArrowLeft size={16} />
            Back to Settings
          </Link>

          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
              ACCESS CONTROL
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Roles & Permissions
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              View the roles available in WallTrack and their access levels.
            </p>
          </div>

          <div className="mb-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-[#E7FF3C]/20 bg-[#1B1B1B] p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-[#E7FF3C]/10 p-3">
                  <ShieldCheck size={22} className="text-[#E7FF3C]" />
                </div>

                <span className="rounded-full bg-[#E7FF3C]/10 px-3 py-1 text-xs font-semibold text-[#E7FF3C]">
                  Full access role
                </span>
              </div>

              <h2 className="mt-5 text-xl font-bold">Administrator</h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Responsible for managing the workspace, employees,
                company information and administrative operations.
              </p>

              <p className="mt-5 flex items-center gap-2 text-sm text-gray-300">
                <Users size={16} />
                {adminCount ?? 0} administrator(s)
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
              <div className="flex items-center justify-between">
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <UserRound size={22} className="text-blue-400" />
                </div>

                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                  Standard role
                </span>
              </div>

              <h2 className="mt-5 text-xl font-bold">Employee</h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Responsible for accessing operational information
                and working with the available workspace features.
              </p>

              <p className="mt-5 flex items-center gap-2 text-sm text-gray-300">
                <Users size={16} />
                {employeeCount ?? 0} employee(s)
              </p>
            </div>
          </div>

          <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1B1B1B]">
            <div className="border-b border-white/10 p-6">
              <div className="flex items-center gap-3">
                <LockKeyhole size={20} className="text-[#E7FF3C]" />

                <div>
                  <h2 className="font-bold">Permission Overview</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Proposed access overview for the two existing roles.
                    Confirm individual permissions before enforcing them.
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-white/5">
              {permissions.map((permission) => {
                const Icon = permission.icon

                return (
                  <div
                    key={permission.name}
                    className="grid gap-5 p-5 lg:grid-cols-[1fr_180px_180px] lg:items-center"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-white/5 p-2">
                        <Icon size={18} className="text-[#E7FF3C]" />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold">
                          {permission.name}
                        </h3>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {permission.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {permission.admin ? (
                        <CheckCircle2 size={17} className="text-green-400" />
                      ) : (
                        <XCircle size={17} className="text-red-400" />
                      )}
                      <span className="text-gray-300">Administrator</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {permission.employee ? (
                        <Eye size={17} className="text-blue-400" />
                      ) : (
                        <XCircle size={17} className="text-red-400" />
                      )}
                      <span className="text-gray-300">Employee</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-400">
              <LockKeyhole size={17} />
              Important
            </div>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              This page is currently informational. It does not change
              database security policies or grant additional permissions.
              Actual access is still controlled by the existing application
              checks and Supabase Row Level Security policies.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function RolesPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <RolesContent />
    </Suspense>
  )
}
