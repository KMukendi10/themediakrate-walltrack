
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import AddEmployeeForm from '@/components/dashboard/AddEmployeeForm'

function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-gray-400">
      Loading employee form...
    </div>
  )
}

async function AddEmployeeContent() {
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

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Administrator'} />

        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <p className="text-sm text-gray-500">
              Dashboard / Employees / Add Employee
            </p>

            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              Add Employee
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Invite a new employee to WallTrack.
            </p>
          </div>

          <AddEmployeeForm />
        </main>
      </div>
    </div>
  )
}

export default function AddEmployeePage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <AddEmployeeContent />
    </Suspense>
  )
}
