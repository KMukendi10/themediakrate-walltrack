import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const password =
      typeof body.password === 'string' ? body.password : ''

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must contain at least 8 characters.' },
        { status: 400 }
      )
    }

    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Password updated successfully.',
    })
  } catch (error) {
    console.error('Password update error:', error)

    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
