import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function AdminGate({
  children,
}: {
  children: React.ReactNode
}) {
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
    console.error('Project edit authorization error:', error)
    throw new Error('Unable to verify your project permissions.')
  }

  if (profile?.role !== 'admin') redirect('/dashboard')

  return children
}

export default function EditProjectLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] p-8 text-gray-400">
          Checking permissions...
        </div>
      }
    >
      <AdminGate>{children}</AdminGate>
    </Suspense>
  )
}
