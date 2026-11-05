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
        { error: 'Only administrators can update company settings.' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const companyName = String(body.company_name || '').trim()

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required.' },
        { status: 400 }
      )
    }

    const updates = {
      company_name: companyName,
      company_email: body.company_email?.trim() || null,
      contact_number: body.contact_number?.trim() || null,
      website: body.website?.trim() || null,
      physical_address: body.physical_address?.trim() || null,
      description: body.description?.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('company_settings')
      .upsert(
        {
          id: 1,
          ...updates,
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (error) {
      console.error('Company settings update error:', error)

      return NextResponse.json(
        { error: 'Failed to save company settings.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Company settings updated successfully.',
      settings: data,
    })
  } catch (error) {
    console.error('Company settings API error:', error)

    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
