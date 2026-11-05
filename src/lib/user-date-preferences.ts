import type { createClient } from '@/lib/supabase/server'
import {
  DEFAULT_DATE_PREFERENCES,
  normalizeDatePreferences,
} from '@/lib/date-format'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

export async function getUserDatePreferences(
  supabase: ServerSupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('date_format, timezone')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('User date preferences lookup error:', error)
    return DEFAULT_DATE_PREFERENCES
  }

  return normalizeDatePreferences(data)
}
