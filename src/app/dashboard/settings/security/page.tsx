import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import ChangePasswordForm from '@/components/dashboard/ChangePasswordForm'

function LoadingPage() {
  return <div className="p-8 text-gray-400">Loading security settings...</div>
}

async function SecurityContent() {
  await connection()
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Security settings authorization error:', error)
    throw new Error('Unable to verify your security settings access.')
  }

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? ''} />

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
                <ShieldCheck size={24} className="text-[#E7FF3C]" />
              </div>

              <div>
                <h1 className="text-3xl font-semibold">Security</h1>
                <p className="mt-2 text-sm text-gray-400">
                  Manage your account password and sign-in security.
                </p>
              </div>
            </div>

            <section className="mb-6 rounded-2xl border border-white/10 bg-[#181818] p-6">
              <p className="text-sm text-gray-400">Signed-in account</p>
              <p className="mt-2 font-medium">{user.email ?? 'Account email unavailable'}</p>
              <p className="mt-2 text-sm text-gray-500">
                Your password is securely managed by the company authentication provider.
              </p>
            </section>

            <ChangePasswordForm />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function SecurityPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <SecurityContent />
    </Suspense>
  )
}
