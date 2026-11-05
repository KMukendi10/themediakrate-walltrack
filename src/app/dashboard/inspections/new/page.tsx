
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import NewInspectionForm from '@/components/dashboard/NewInspectionForm'

async function NewInspectionPageContent() {
  await connection()

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: walls, error } = await supabase
    .from('walls')
    .select('id, wall_code, name, suburb, city, status')
    .order('wall_code', { ascending: true })

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Topbar email={user.email ?? 'Employee'} />

        <main className="p-8">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/dashboard/inspections"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#E7FF3C] mb-6"
            >
              <ArrowLeft size={16} />
              Back to Inspections
            </Link>

            <div className="mb-8">
              <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C] uppercase mb-2">
                Wall Management
              </p>

              <h1 className="text-3xl font-bold">
                Record Inspection
              </h1>

              <p className="text-gray-400 mt-2">
                Record the condition of a wall and upload inspection photos.
              </p>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
                Failed to load walls: {error.message}
              </div>
            ) : (
              <NewInspectionForm
                walls={walls ?? []}
                userId={user.id}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function NewInspectionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] text-white flex items-center justify-center">
          <p className="text-gray-400">Loading inspection form...</p>
        </div>
      }
    >
      <NewInspectionPageContent />
    </Suspense>
  )
}
