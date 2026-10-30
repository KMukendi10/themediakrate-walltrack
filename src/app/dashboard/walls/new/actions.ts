
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createWall(formData: FormData) {
  const supabase = await createClient()

  // Verify the signed-in employee
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const name = String(formData.get('name') ?? '').trim()
  const latitude = Number(formData.get('latitude'))
  const longitude = Number(formData.get('longitude'))
  const locationMethod = String(formData.get('location_method') ?? '')

  if (
    !name ||
    formData.get('latitude') === null ||
    formData.get('latitude') === '' ||
    formData.get('longitude') === null ||
    formData.get('longitude') === '' ||
    !['gps', 'manual'].includes(locationMethod)
  ) {
    redirect('/dashboard/walls/new?error=Please provide a name and valid location coordinates')
  }

  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    redirect('/dashboard/walls/new?error=Please enter valid GPS coordinates')
  }

  const optionalNumber = (field: string) => {
    const value = formData.get(field)
    if (value === null || value === '') return null

    const number = Number(value)
    return Number.isFinite(number) && number >= 0 ? number : null
  }

  const wallData = {
    name,
    description: String(formData.get('description') ?? '').trim() || null,
    wall_type: String(formData.get('wall_type') ?? '') || null,
    address: String(formData.get('address') ?? '').trim() || null,
    suburb: String(formData.get('suburb') ?? '').trim() || null,
    city: String(formData.get('city') ?? '').trim() || null,
    province: String(formData.get('province') ?? '') || null,
    postal_code: String(formData.get('postal_code') ?? '').trim() || null,
    latitude,
    longitude,
    location_method: locationMethod,
    gps_accuracy: optionalNumber('gps_accuracy'),
    width_m: optionalNumber('width_m'),
    height_m: optionalNumber('height_m'),
    status: String(formData.get('status') ?? 'active'),
    registered_by: user.id,
  }

  const { error } = await supabase
    .from('walls')
    .insert(wallData)

  if (error) {
    console.error('Wall registration error:', error.message)
    redirect('/dashboard/walls/new?error=Unable to register wall. Please check the details and try again.')
  }

  revalidatePath('/dashboard/walls')
  revalidatePath('/dashboard')

  redirect('/dashboard/walls?success=Wall registered successfully')
}
