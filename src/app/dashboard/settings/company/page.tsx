import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Building2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import CompanyProfileForm from '@/components/dashboard/CompanyProfileForm'

function LoadingPage() {
  return (
    <div className="p-8 text-gray-400">
      Loading company profile...
    </div>
  )
}

async function CompanyProfileContent() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: settings, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('id', 1)
    .single()

  if (error || !settings) {
    throw new Error('Could not load company settings.')
  }

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
                <Building2 size={24} className="text-[#E7FF3C]" />
              </div>

              <div>
                <h1 className="text-3xl font-semibold">
                  Company Profile
                </h1>

                <p className="mt-2 text-sm text-gray-400">
                  Manage The Media Krate&apos;s company information.
                </p>
              </div>
            </div>

            <CompanyProfileForm settings={settings} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function CompanyProfilePage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <CompanyProfileContent />
    </Suspense>
  )
}
