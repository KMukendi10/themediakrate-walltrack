
import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import {
  Users,
  ShieldCheck,
  UserRound,
  Mail,
  CalendarDays,
  Plus,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

type Employee = {
  id: string
  full_name: string
  email: string
  role: string
  created_at: string
}

function LoadingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-white">
      <p className="text-sm text-gray-400">
        Loading employees...
      </p>
    </div>
  )
}

async function EmployeesContent() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Check whether the current user is an admin.
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentProfile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Load all employee profiles.
  const {
    data: employeeData,
    error: employeeError,
  } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .order('created_at', { ascending: false })

  const employees = (employeeData ?? []) as Employee[]

  const totalEmployees = employees.length

  const admins = employees.filter(
    (employee) => employee.role === 'admin'
  ).length

  const regularEmployees = employees.filter(
    (employee) => employee.role === 'employee'
  ).length

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Admin'} />

        <main className="p-6 lg:p-8">
          {/* Page heading */}
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
                TEAM MANAGEMENT
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Employees
              </h1>

              <p className="mt-2 text-sm text-gray-400">
                Manage employee accounts, roles and team information.
              </p>
            </div>

            <Link
              href="/dashboard/employees/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d7ef30]"
            >
              <Plus size={18} />
              Add Employee
            </Link>
          </div>

          {/* Summary cards */}
          <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Total Employees
                </p>
                <Users size={20} className="text-[#E7FF3C]" />
              </div>

              <p className="mt-4 text-4xl font-bold text-white">
                {totalEmployees}
              </p>

              <p className="mt-3 text-xs text-gray-500">
                Registered team members
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Administrators
                </p>
                <ShieldCheck size={20} className="text-[#E7FF3C]" />
              </div>

              <p className="mt-4 text-4xl font-bold text-white">
                {admins}
              </p>

              <p className="mt-3 text-xs text-gray-500">
                Accounts with admin access
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Employees
                </p>
                <UserRound size={20} className="text-green-400" />
              </div>

              <p className="mt-4 text-4xl font-bold text-white">
                {regularEmployees}
              </p>

              <p className="mt-3 text-xs text-gray-500">
                Standard employee accounts
              </p>
            </div>
          </div>

          {/* Employee directory */}
          <section className="overflow-hidden rounded-xl border border-white/10 bg-[#1B1B1B]">
            <div className="border-b border-white/10 p-6">
              <h2 className="text-lg font-bold">
                Employee Directory
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                View registered team members and their account details.
              </p>
            </div>

            {employeeError ? (
              <div className="p-8">
                <p className="text-sm text-red-400">
                  Unable to load employee records.
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  {employeeError.message}
                </p>
              </div>
            ) : employees.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Users
                  size={40}
                  className="mx-auto text-gray-600"
                />

                <h3 className="mt-4 text-lg font-semibold">
                  No employees found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Employee accounts will appear here once registered.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex flex-col justify-between gap-4 p-6 transition hover:bg-white/[0.03] sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7FF3C]/10 text-[#E7FF3C]">
                        <UserRound size={22} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-semibold text-white">
                          {employee.full_name}
                        </h3>

                        <p className="mt-1 flex items-center gap-2 break-all text-sm text-gray-400">
                          <Mail size={14} className="shrink-0" />
                          {employee.email}
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                          <CalendarDays size={13} />
                          Joined {formatDate(employee.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center sm:justify-end">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                          employee.role === 'admin'
                            ? 'bg-[#E7FF3C]/10 text-[#E7FF3C]'
                            : 'bg-blue-500/10 text-blue-400'
                        }`}
                      >
                        {employee.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<LoadingPage />}>
      <EmployeesContent />
    </Suspense>
  )
}
