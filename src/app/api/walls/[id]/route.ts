import { NextResponse } from 'next/server'
import { authorizeRoles } from '@/lib/supabase/authorization'
import { createAdminClient } from '@/lib/supabase/admin'
import { removeStorageTree } from '@/lib/supabase/storage-cleanup'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await authorizeRoles(['admin'])
  if (!auth.authorized) return auth.response

  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid wall details.' }, { status: 400 })
  }

  const values = body as Record<string, unknown>
  const name = typeof values.name === 'string' ? values.name.trim() : ''
  const latitude = values.latitude
  const longitude = values.longitude
  const optionalNumber = (value: unknown) =>
    value === null ||
    (typeof value === 'number' && Number.isFinite(value) && value >= 0)

  if (
    !name ||
    name.length > 200 ||
    typeof latitude !== 'number' ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    typeof longitude !== 'number' ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !optionalNumber(values.gps_accuracy) ||
    !optionalNumber(values.width_m) ||
    !optionalNumber(values.height_m) ||
    !['gps', 'manual'].includes(String(values.location_method)) ||
    !['active', 'inactive', 'under_maintenance', 'removed'].includes(
      String(values.status)
    )
  ) {
    return NextResponse.json({ error: 'Invalid wall details.' }, { status: 400 })
  }

  const updates = {
    name,
    description:
      typeof values.description === 'string'
        ? values.description.trim() || null
        : null,
    wall_type: typeof values.wall_type === 'string' ? values.wall_type || null : null,
    address:
      typeof values.address === 'string' ? values.address.trim() || null : null,
    suburb:
      typeof values.suburb === 'string' ? values.suburb.trim() || null : null,
    city: typeof values.city === 'string' ? values.city.trim() || null : null,
    province:
      typeof values.province === 'string' ? values.province || null : null,
    postal_code:
      typeof values.postal_code === 'string'
        ? values.postal_code.trim() || null
        : null,
    latitude,
    longitude,
    location_method: values.location_method,
    gps_accuracy: values.gps_accuracy,
    width_m: values.width_m,
    height_m: values.height_m,
    status: values.status,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await auth.supabase
    .from('walls')
    .update(updates)
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Wall update error:', error)
    return NextResponse.json(
      { error: 'Unable to update this wall.' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json({ error: 'Wall not found.' }, { status: 404 })
  }

  return NextResponse.json({ id: data.id })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await authorizeRoles(['admin'])
  if (!auth.authorized) return auth.response

  const { id } = await params
  const admin = createAdminClient()
  const { data: wall, error: wallError } = await admin
    .from('walls')
    .select('id')
    .eq('id', id)
    .maybeSingle()

  if (wallError) {
    console.error('Wall deletion lookup error:', wallError)
    return NextResponse.json(
      { error: 'Unable to verify this wall.' },
      { status: 500 }
    )
  }
  if (!wall) {
    return NextResponse.json({ error: 'Wall not found.' }, { status: 404 })
  }

  const storageResult = await removeStorageTree(admin, id)
  if (storageResult.error) {
    return NextResponse.json({ error: storageResult.error }, { status: 500 })
  }

  const { error: photoError } = await admin
    .from('wall_photos')
    .delete()
    .eq('wall_id', id)
  if (photoError) {
    console.error('Wall photo metadata deletion error:', photoError)
    return NextResponse.json(
      { error: 'Stored photos were removed, but their records could not be deleted. Retry wall deletion.' },
      { status: 500 }
    )
  }

  const { error: inspectionError } = await admin
    .from('inspections')
    .delete()
    .eq('wall_id', id)
  if (inspectionError) {
    console.error('Wall inspection deletion error:', inspectionError)
    return NextResponse.json(
      { error: 'Photos were removed, but inspection records could not be deleted. Retry wall deletion.' },
      { status: 500 }
    )
  }

  const { error: assignmentError } = await admin
    .from('wall_projects')
    .delete()
    .eq('wall_id', id)
  if (assignmentError) {
    console.error('Wall assignment deletion error:', assignmentError)
    return NextResponse.json(
      { error: 'Photos and inspections were deleted, but project assignments could not be removed. Retry wall deletion.' },
      { status: 500 }
    )
  }

  const { data, error } = await admin
    .from('walls')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Wall deletion error:', error)
    return NextResponse.json(
      { error: 'Related records were deleted, but the wall itself could not be deleted. Retry wall deletion.' },
      { status: 500 }
    )
  }
  if (!data) {
    return NextResponse.json({ error: 'Wall not found.' }, { status: 404 })
  }

  return NextResponse.json({
    id: data.id,
    deleted: true,
    photosRemoved: storageResult.removedCount,
  })
}
