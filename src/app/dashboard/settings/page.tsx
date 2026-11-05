
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import {
  Building2,
  UserRound,
  ShieldCheck,
  SlidersHorizontal,
  Settings as SettingsIcon,
  ChevronRight,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

function LoadingPage() {
  return (
    <div className="p-8 text-gray-400">
      Loading settings...
    </div>
  )
}

async function SettingsContent() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const settings = [
    {
      title: 'Company Profile',
      description: 'Manage The Media Krate company information.',
      icon: Building2,
      href: '/dashboard/settings/company',
    },
    {
      title: 'Account Settings',
      description: 'View and manage your personal account details.',
      icon: UserRound,
      href: '/dashboard/settings/account',
    },
    {
      title: 'Roles & Permissions',
      description: 'Manage employee roles and access permissions.',
      icon: ShieldCheck,
      href: '/dashboard/settings/roles',
    },
    {
      title: 'System Preferences',
      description: 'Configure application preferences and settings.',
      icon: SlidersHorizontal,
      href: '/dashboard/settings/preferences',
    },
    {
      title: 'Security',
      description: 'Manage account security and password settings.',
      icon: SettingsIcon,
      href: '/dashboard/settings/security',
    },
  ]

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <p className="mb-2 text-sm text-[#E7FF3C]">
                Administration
              </p>

              <h1 className="text-3xl font-semibold">
                Settings
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Manage your company, account and system configuration.
              </p>
            </div>

            <section className="mb-8 rounded-2xl border border-white/10 bg-[#181818] p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7FF3C]/10">
                  <UserRound className="text-[#E7FF3C]" size={23} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    {profile.full_name}
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    {profile.email}
                  </p>
                </div>

                <span className="ml-auto rounded-full border border-[#E7FF3C]/20 bg-[#E7FF3C]/10 px-3 py-1 text-xs font-medium text-[#E7FF3C]">
                  Administrator
                </span>
              </div>
            </section>

            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                General Settings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a section to manage its settings.
              </p>
            </div>

            <div className="space-y-3">
              {settings.map((setting) => {
                const Icon = setting.icon

                return (
                  <a
                    key={setting.title}
                    href={setting.href}
                    className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#181818] p-5 transition hover:border-[#E7FF3C]/30 hover:bg-[#1d1d1d]"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-gray-300 transition group-hover:bg-[#E7FF3C]/10 group-hover:text-[#E7FF3C]">
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">
                        {setting.title}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        {setting.description}
                      </p>
                    </div>

                    <ChevronRight
                      size={19}
                      className="shrink-0 text-gray-500 transition group-hover:translate-x-1 group-hover:text-[#E7FF3C]"
                    />
                  </a>
                )
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <SettingsContent />
    </Suspense>
  )
}
