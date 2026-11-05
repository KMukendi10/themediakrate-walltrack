
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { Settings2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import SystemPreferencesForm from '@/components/dashboard/SystemPreferencesForm'

function LoadingPage() {
  return (
    <div className="p-8 text-gray-400">
      Loading preferences...
    </div>
  )
}

async function PreferencesContent() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: preferences, error: preferencesError } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (preferencesError) {
    console.error('Preferences page lookup error:', preferencesError)
  }

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? ''} />

        <main className="p-6 lg:p-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8">
              <p className="mb-2 text-sm text-[#E7FF3C]">
                Administration
              </p>

              <h1 className="text-3xl font-semibold">
                System Preferences
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Configure your personal application preferences.
              </p>
            </div>

            <section className="mb-6 rounded-2xl border border-white/10 bg-[#181818] p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7FF3C]/10">
                  <Settings2 className="text-[#E7FF3C]" size={23} />
                </div>

                <div>
                  <h2 className="font-semibold">
                    Application Preferences
                  </h2>

                  <p className="mt-1 text-sm text-gray-400">
                    These settings apply to your account.
                  </p>
                </div>
              </div>
            </section>

            {preferencesError && (
              <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                Saved preferences could not be loaded. Defaults are shown; changes can still be saved.
              </p>
            )}
            <SystemPreferencesForm initialPreferences={preferences} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <PreferencesContent />
    </Suspense>
  )
}
