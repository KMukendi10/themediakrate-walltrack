
import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function verifyAdmin() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: 'You must be logged in to perform this action.' },
        { status: 401 }
      ),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return {
      error: NextResponse.json(
        { error: 'You do not have permission to perform this action.' },
        { status: 403 }
      ),
    }
  }

  return { supabase, user }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin()

    if (auth.error) return auth.error

    const body = await request.json()

    const fullName =
      typeof body.full_name === 'string' ? body.full_name.trim() : ''

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : ''

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

    const admin = createAdminClient()

    const { data, error } = await admin.auth.admin.inviteUserByEmail(
      email,
      {
        data: { full_name: fullName },
      }
    )

    if (error) {
      if (
        error.code === 'email_exists' ||
        error.code === 'user_already_exists'
      ) {
        return NextResponse.json(
          { error: 'An account already exists for this email address.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'The invitation could not be sent. Please verify the email and try again.' },
        { status: 400 }
      )
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('id', data.user.id)
      .maybeSingle()

    if (profileError || !profile) {
      if (profileError) {
        console.error('Invited employee profile verification error:', profileError)
      }

      const { error: cleanupError } = await admin.auth.admin.deleteUser(
        data.user.id
      )

      if (cleanupError) {
        console.error('Incomplete employee invitation cleanup error:', cleanupError)
        return NextResponse.json(
          {
            error: 'The invitation was created, but the employee profile could not be verified and automatic cleanup failed. Contact an administrator before retrying.',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        {
          error: 'The employee profile was not created, so the invitation was canceled. Please contact an administrator.',
        },
        { status: 500 }
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

export async function PATCH(request: Request) {
  try {
    const auth = await verifyAdmin()

    if (auth.error) return auth.error

    const body = await request.json()

    const employeeId =
      typeof body.id === 'string' ? body.id.trim() : ''

    const fullName =
      typeof body.full_name === 'string' ? body.full_name.trim() : ''

    const email =
      typeof body.email === 'string'
        ? body.email.trim().toLowerCase()
        : ''

    const role = body.role

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID is required.' },
        { status: 400 }
      )
    }

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

    if (role !== 'admin' && role !== 'employee') {
      return NextResponse.json(
        { error: 'Select a valid employee role.' },
        { status: 400 }
      )
    }

    if (employeeId === auth.user.id && role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot remove your own administrator role.' },
        { status: 400 }
      )
    }

    const { data: existingEmployee, error: employeeError } =
      await auth.supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', employeeId)
        .single()

    if (employeeError || !existingEmployee) {
      return NextResponse.json(
        { error: 'Employee account could not be found.' },
        { status: 404 }
      )
    }

    const admin = createAdminClient()

    // Update the employee's Supabase Authentication account.
    const { error: authUpdateError } =
      await admin.auth.admin.updateUserById(employeeId, {
        email,
        user_metadata: {
          full_name: fullName,
        },
      })

    if (authUpdateError) {
      return NextResponse.json(
        { error: authUpdateError.message },
        { status: 400 }
      )
    }

    // Keep the employee profile in sync with Authentication.
    const { error: profileUpdateError } = await auth.supabase
      .from('profiles')
      .update({
        full_name: fullName,
        email,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', employeeId)

    if (profileUpdateError) {
      // Attempt to restore Authentication if the profile update fails.
      const { error: rollbackError } = await admin.auth.admin.updateUserById(employeeId, {
        email: existingEmployee.email,
        user_metadata: {
          full_name: existingEmployee.full_name,
        },
      })

      if (rollbackError) {
        console.error('Employee Auth rollback error:', rollbackError)
        return NextResponse.json(
          {
            error: 'The profile could not be updated and the authentication rollback failed. The account may be inconsistent; contact an administrator before retrying.',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'The profile could not be updated. Authentication changes were rolled back; please try again.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Employee details updated successfully.',
      employee: {
        id: employeeId,
        full_name: fullName,
        email,
        role,
      },
    })
  } catch (error) {
    console.error('Employee update error:', error)

    return NextResponse.json(
      { error: 'Something went wrong while updating the employee.' },
      { status: 500 }
    )
  }
}
