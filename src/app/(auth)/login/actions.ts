
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { isSupportedDashboardPage } from '@/lib/dashboard-preferences'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    redirect('/login?error=Please enter your email and password')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect('/login?error=Invalid email or password')
  }

  let destination = '/dashboard'
  if (data.user) {
    const { data: preferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('default_dashboard_page')
      .eq('user_id', data.user.id)
      .maybeSingle()

    if (preferencesError) {
      console.error('Login dashboard preference lookup error:', preferencesError)
    } else if (isSupportedDashboardPage(preferences?.default_dashboard_page)) {
      destination = preferences.default_dashboard_page
    }
  }

  redirect(destination)
}
