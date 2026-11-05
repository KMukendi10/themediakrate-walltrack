import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, UserRound } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import AccountSettingsForm from '@/components/dashboard/AccountSettingsForm'

function LoadingPage() {
  return (
    <div className="p-8 text-gray-400">
      Loading account settings...
    </div>
  )
}

async function AccountSettingsContent() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw new Error('Could not load your account details.')
  }

  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar />

        <main className="p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <Link
              href="/dashboard/settings"
              className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#E7FF3C]"
            >
              <ArrowLeft size={17} />
              Back to Settings
            </Link>

            <div className="mb-8 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7FF3C]/10">
                <UserRound
                  size={24}
                  className="text-[#E7FF3C]"
                />
              </div>

              <div>
                <h1 className="text-3xl font-semibold">
                  Account Settings
                </h1>

                <p className="mt-2 text-sm text-gray-400">
                  Manage your personal information and password.
                </p>
              </div>
            </div>

            <AccountSettingsForm profile={profile} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <AccountSettingsContent />
    </Suspense>
  )
}
