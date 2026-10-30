
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { Suspense } from 'react'

import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-white">
      <p className="text-sm text-gray-400">
        Loading WallTrack workspace...
      </p>
    </div>
  )
}

async function DashboardContent() {
  // Wait for the incoming request before accessing user-specific data.
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Employee'} />

        <main className="p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
              OVERVIEW
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Welcome to your WallTrack workspace.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: 'Total Walls',
                value: '0',
                detail: 'Registered advertising locations',
              },
              {
                title: 'Active Projects',
                value: '0',
                detail: 'Currently running campaigns',
              },
              {
                title: 'Pending Inspections',
                value: '0',
                detail: 'Awaiting inspection',
              },
            ].map((stat) => (
              <div
                key={stat.title}
                className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6"
              >
                <p className="text-sm text-gray-400">
                  {stat.title}
                </p>

                <p className="mt-4 text-4xl font-bold text-[#E7FF3C]">
                  {stat.value}
                </p>

                <p className="mt-3 text-xs text-gray-500">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-[#1B1B1B] p-8">
            <h2 className="text-lg font-bold">
              Welcome to WallTrack
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
              Your workspace is ready. Start by registering advertising
              walls, creating projects and managing field operations.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}
