
import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect, notFound } from 'next/navigation'
import {
  ArrowLeft,
  UserRound,
  Mail,
  CalendarDays,
  ShieldCheck,
  User,
  Pencil,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import { getUserDatePreferences } from '@/lib/user-date-preferences'
import { formatAppDate } from '@/lib/date-format'
import CopyEmployeeId from '@/components/dashboard/CopyEmployeeId'
import DeleteEmployeeButton from '@/components/dashboard/DeleteEmployeeButton'

type Employee = {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

type EmployeePageProps = {
  params: Promise<{
    id: string
  }>
}

function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-white">
      <p className="text-sm text-gray-400">
        Loading employee details...
      </p>
    </div>
  )
}

async function EmployeeDetailsContent({
  params,
}: EmployeePageProps) {
  await connection()

  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/dashboard')
  }
  const datePreferences = await getUserDatePreferences(supabase, user.id)

  const {
    data: employeeData,
    error: employeeError,
  } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('id', id)
    .maybeSingle()

  if (employeeError) {
    throw new Error(employeeError.message)
  }

  if (!employeeData) {
    notFound()
  }

  const employee = employeeData as Employee

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Admin'} />

        <main className="p-6 lg:p-8">
          <Link
            href="/dashboard/employees"
            className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#E7FF3C]"
          >
            <ArrowLeft size={17} />
            Back to Employees
          </Link>

          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
                TEAM MANAGEMENT
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Employee Details
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                View employee profile and account information.
              </p>
            </div>

            <Link
              href={`/dashboard/employees/${employee.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d6ee32]"
            >
              <Pencil size={16} />
              Edit Employee
            </Link>
            {user.id !== employee.id && (
              <DeleteEmployeeButton employeeId={employee.id} />
            )}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {/* Employee profile */}
            <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6 xl:col-span-1">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#E7FF3C]/10 text-[#E7FF3C]">
                  <UserRound size={42} />
                </div>

                <h2 className="mt-5 text-xl font-bold">
                  {employee.full_name}
                </h2>

                <p className="mt-2 break-all text-sm text-gray-400">
                  {employee.email}
                </p>

                <span
                  className={`mt-4 rounded-full px-4 py-2 text-xs font-semibold capitalize ${
                    employee.role === 'admin'
                      ? 'bg-[#E7FF3C]/10 text-[#E7FF3C]'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}
                >
                  {employee.role}
                </span>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-xs font-semibold tracking-wider text-gray-500">
                  ACCOUNT TYPE
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-[#E7FF3C]">
                    {employee.role === 'admin' ? (
                      <ShieldCheck size={20} />
                    ) : (
                      <User size={20} />
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium capitalize">
                      {employee.role} Account
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {employee.role === 'admin'
                        ? 'Administrator access'
                        : 'Standard employee access'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Account information */}
            <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6 xl:col-span-2">
              <div className="border-b border-white/10 pb-5">
                <h2 className="text-lg font-bold">
                  Account Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Registered information associated with this employee.
                </p>
              </div>

              <div className="grid gap-6 pt-6 sm:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <UserRound size={17} />
                    <p className="text-xs font-medium">
                      Full Name
                    </p>
                  </div>

                  <p className="mt-3 font-medium">
                    {employee.full_name}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Mail size={17} />
                    <p className="text-xs font-medium">
                      Email Address
                    </p>
                  </div>

                  <p className="mt-3 break-all font-medium">
                    {employee.email}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <ShieldCheck size={17} />
                    <p className="text-xs font-medium">
                      Account Role
                    </p>
                  </div>

                  <p className="mt-3 font-medium capitalize">
                    {employee.role}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <CalendarDays size={17} />
                    <p className="text-xs font-medium">
                      Registration Date
                    </p>
                  </div>

                  <p className="mt-3 font-medium">
                    {formatAppDate(employee.created_at, datePreferences)}
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <h3 className="text-sm font-semibold">
                  Account Reference
                </h3>

                <div className="mt-3 flex flex-col justify-between gap-3 rounded-lg border border-white/10 bg-black/20 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">
                      Employee ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-gray-300">
                      {employee.id}
                    </p>
                  </div>

                  <CopyEmployeeId employeeId={employee.id} />
                </div>

                <p className="mt-4 text-xs text-gray-500">
                  Registered on {formatAppDate(
                    employee.created_at,
                    datePreferences,
                    true
                  )}
                </p>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function EmployeeDetailsPage(
  props: EmployeePageProps
) {
  return (
    <Suspense fallback={<LoadingPage />}>
      <EmployeeDetailsContent params={props.params} />
    </Suspense>
  )
}
