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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can update account settings.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const fullName =
      typeof body.full_name === 'string'
        ? body.full_name.trim()
        : ''

    if (!fullName || fullName.length > 150) {
      return NextResponse.json(
        { error: 'Enter a valid full name.' },
        { status: 400 }
      )
    }

    const { error: authUpdateError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
      },
    })

    if (authUpdateError) {
      return NextResponse.json(
        { error: authUpdateError.message },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Account profile update error:', updateError)
      const { error: metadataRollbackError } = await supabase.auth.updateUser({
        data: user.user_metadata,
      })

      if (metadataRollbackError) {
        console.error('Account metadata rollback error:', metadataRollbackError)
        return NextResponse.json(
          {
            error: 'Your profile could not be updated and automatic recovery was incomplete. Contact an administrator before retrying.',
          },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { error: 'Your profile could not be updated. Authentication details were restored; please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Account details updated successfully.',
    })
  } catch (error) {
    console.error('Account settings error:', error)

    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
