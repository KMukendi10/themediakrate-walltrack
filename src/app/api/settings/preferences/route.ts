
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const allowedDateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY']

const allowedTimezones = [
  'Africa/Johannesburg',
  'UTC',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai',
]

const allowedDashboardPages = [
  '/dashboard',
  '/dashboard/walls',
  '/dashboard/map',
  '/dashboard/projects',
  '/dashboard/inspections',
]

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in.' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const {
      date_format,
      timezone,
      default_dashboard_page,
      email_notifications,
    } = body

    if (!allowedDateFormats.includes(date_format)) {
      return NextResponse.json(
        { error: 'Invalid date format.' },
        { status: 400 }
      )
    }

    if (!allowedTimezones.includes(timezone)) {
      return NextResponse.json(
        { error: 'Invalid time zone.' },
        { status: 400 }
      )
    }

    if (!allowedDashboardPages.includes(default_dashboard_page)) {
      return NextResponse.json(
        { error: 'Invalid dashboard page.' },
        { status: 400 }
      )
    }

    if (typeof email_notifications !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid email notification preference.' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: user.id,
          date_format,
          timezone,
          default_dashboard_page,
          email_notifications,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )

    if (error) {
      console.error('Preferences update error:', error)

      return NextResponse.json(
        { error: 'Could not save your preferences.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences saved successfully.',
    })
  } catch (error) {
    console.error('Preferences API error:', error)

    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    )
  }
}
