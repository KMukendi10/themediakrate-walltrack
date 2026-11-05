import 'server-only'

import { NextResponse } from 'next/server'
import { createClient } from './server'

type AppRole = 'admin' | 'employee'

export async function authorizeRoles(allowedRoles: readonly AppRole[]) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      ),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('Authorization profile lookup error:', profileError)
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: 'Unable to verify your permissions.' },
        { status: 500 }
      ),
    }
  }

  if (!profile || !allowedRoles.some((role) => role === profile.role)) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: 'You do not have permission to perform this action.' },
        { status: 403 }
      ),
    }
  }

  return {
    authorized: true as const,
    supabase,
    user,
    role: profile.role,
  }
}
