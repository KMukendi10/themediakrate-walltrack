
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    // Verify the person making the request is logged in.
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to perform this action.' },
        { status: 401 }
      )
    }

    // Only administrators may invite employees.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'You do not have permission to invite employees.' },
        { status: 403 }
      )
    }

    // Validate the submitted details.
    const body = await request.json()
    const fullName =
      typeof body.full_name === 'string' ? body.full_name.trim() : ''
    const email =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!fullName || fullName.length > 100) {
      return NextResponse.json(
        { error: 'Enter a valid full name (maximum 100 characters).' },
        { status: 400 }
      )
    }

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: 'Enter a valid email address.' },
        { status: 400 }
      )
    }

    // Invite the employee using the server-side Admin API.
    // The database trigger automatically creates their profile
    // with the default employee role.
    const admin = createAdminClient()

    const { data, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: fullName,
        },
      })

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        message: 'Employee invitation sent successfully.',
        employee: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Employee invitation error:', error)

    return NextResponse.json(
      { error: 'Something went wrong while inviting the employee.' },
      { status: 500 }
    )
  }
}
