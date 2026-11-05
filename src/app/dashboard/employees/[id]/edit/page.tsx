
import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import EditEmployeeForm from '@/components/dashboard/EditEmployeeForm'

type EditEmployeePageProps = {
  params: Promise<{ id: string }>
}

function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-gray-400">
      Loading employee...
    </div>
  )
}

async function EditEmployeeContent({
  params,
}: EditEmployeePageProps) {
  await connection()

  const { id } = await params

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

  const { data: employee, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('id', id)
    .single()

  if (error || !employee) {
    notFound()
  }

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Admin'} />

        <main className="mx-auto max-w-5xl p-6 lg:p-10">
          <Link
            href={`/dashboard/employees/${employee.id}`}
            className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#E7FF3C]"
          >
            <ArrowLeft size={16} />
            Back to Employee Details
          </Link>

          <div className="mb-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E7FF3C]/10 text-[#E7FF3C]">
              <Pencil size={22} />
            </div>

            <h1 className="text-2xl font-bold text-white">
              Edit Employee
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              Update employee information and account permissions.
            </p>
          </div>

          <section className="rounded-2xl border border-white/10 bg-[#181818] p-6 sm:p-8">
            <EditEmployeeForm employee={employee} />
          </section>
        </main>
      </div>
    </div>
  )
}

export default function EditEmployeePage(
  props: EditEmployeePageProps
) {
  return (
    <Suspense fallback={<LoadingPage />}>
      <EditEmployeeContent params={props.params} />
    </Suspense>
  )
}
