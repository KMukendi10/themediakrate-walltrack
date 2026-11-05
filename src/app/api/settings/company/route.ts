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

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Please provide valid company details.' },
        { status: 400 }
      )
    }

    const values = body as Record<string, unknown>
    const companyName =
      typeof values.company_name === 'string'
        ? values.company_name.trim()
        : ''
    const readOptionalText = (key: string, maximumLength: number) => {
      const value = values[key]
      if (value === undefined || value === null || value === '') return null
      if (
        typeof value !== 'string' ||
        value.trim().length > maximumLength
      ) {
        return undefined
      }
      return value.trim() || null
    }

    const companyEmail = readOptionalText('company_email', 254)
    const contactNumber = readOptionalText('contact_number', 30)
    const website = readOptionalText('website', 255)
    const physicalAddress = readOptionalText('physical_address', 1000)
    const description = readOptionalText('description', 2000)

    if (!companyName || companyName.length > 150) {
      return NextResponse.json(
        { error: 'Enter a valid company name (maximum 150 characters).' },
        { status: 400 }
      )
    }

    if (
      companyEmail === undefined ||
      (companyEmail !== null &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail)) ||
      contactNumber === undefined ||
      website === undefined ||
      physicalAddress === undefined ||
      description === undefined
    ) {
      return NextResponse.json(
        { error: 'One or more company details are invalid or too long.' },
        { status: 400 }
      )
    }

    if (website) {
      try {
        const parsedWebsite = new URL(website)
        if (!['http:', 'https:'].includes(parsedWebsite.protocol)) {
          throw new Error('Unsupported protocol')
        }
      } catch {
        return NextResponse.json(
          { error: 'Enter a valid company website URL.' },
          { status: 400 }
        )
      }
    }

    const updates = {
      company_name: companyName,
      company_email: companyEmail,
      contact_number: contactNumber,
      website,
      physical_address: physicalAddress,
      description,
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
