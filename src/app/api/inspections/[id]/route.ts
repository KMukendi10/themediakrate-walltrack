import { NextResponse } from 'next/server'
import { authorizeRoles } from '@/lib/supabase/authorization'
import { createAdminClient } from '@/lib/supabase/admin'
import { removeStorageTree } from '@/lib/supabase/storage-cleanup'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await authorizeRoles(['admin'])
  if (!auth.authorized) return auth.response

  const { id } = await params
  const admin = createAdminClient()
  const { data: inspection, error: inspectionError } = await admin
    .from('inspections')
    .select('id, wall_id')
    .eq('id', id)
    .maybeSingle()

  if (inspectionError) {
    console.error('Inspection deletion lookup error:', inspectionError)
    return NextResponse.json(
      { error: 'Unable to verify this inspection.' },
      { status: 500 }
    )
  }
  if (!inspection) {
    return NextResponse.json(
      { error: 'Inspection not found.' },
      { status: 404 }
    )
  }

  const prefix = `${inspection.wall_id}/${id}`
  const storageResult = await removeStorageTree(admin, prefix)
  if (storageResult.error) {
    return NextResponse.json({ error: storageResult.error }, { status: 500 })
  }

  const { error: photoError } = await admin
    .from('wall_photos')
    .delete()
    .eq('wall_id', inspection.wall_id)
    .like('image_path', `${prefix}/%`)
  if (photoError) {
    console.error('Inspection photo metadata deletion error:', photoError)
    return NextResponse.json(
      { error: 'Stored photos were removed, but their records could not be deleted. Retry inspection deletion.' },
      { status: 500 }
    )
  }

  const { data, error } = await admin
    .from('inspections')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Inspection deletion error:', error)
    return NextResponse.json(
      { error: 'Photos were removed, but the inspection could not be deleted. Retry inspection deletion.' },
      { status: 500 }
    )
  }
  if (!data) {
    return NextResponse.json(
      { error: 'Inspection not found.' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    id: data.id,
    deleted: true,
    photosRemoved: storageResult.removedCount,
  })
}
