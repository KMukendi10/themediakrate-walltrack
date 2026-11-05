import { NextResponse } from 'next/server'
import { authorizeRoles } from '@/lib/supabase/authorization'

const allowedConditions = ['excellent', 'good', 'fair', 'poor', 'damaged']
const allowedPhotoTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])
const maxPhotoSize = 10 * 1024 * 1024

function isValidDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00`)) &&
    new Date(`${value}T00:00:00`).toISOString().slice(0, 10) === value
  )
}

async function rollbackInspection(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  inspectionId: string,
  uploadedPaths: string[]
) {
  if (uploadedPaths.length > 0) {
    const { error: metadataError } = await supabase
      .from('wall_photos')
      .delete()
      .in('image_path', uploadedPaths)

    if (metadataError) {
      console.error('Inspection photo metadata rollback error:', metadataError)
    }

    const { error: storageError } = await supabase.storage
      .from('wall-photos')
      .remove(uploadedPaths)

    if (storageError) {
      console.error('Inspection photo storage rollback error:', storageError)
    }
  }

  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', inspectionId)

  if (error) {
    console.error('Inspection record rollback error:', error)
  }
}

export async function POST(request: Request) {
  const auth = await authorizeRoles(['admin', 'employee'])
  if (!auth.authorized) return auth.response

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Invalid inspection submission.' },
      { status: 400 }
    )
  }

  const wallId = formData.get('wall_id')
  const condition = formData.get('condition')
  const inspectionDate = formData.get('inspection_date')
  const notes = formData.get('notes')
  const photos = formData.getAll('photos')

  if (
    typeof wallId !== 'string' ||
    !wallId ||
    typeof condition !== 'string' ||
    !allowedConditions.includes(condition) ||
    typeof inspectionDate !== 'string' ||
    !isValidDate(inspectionDate) ||
    typeof notes !== 'string' ||
    notes.length > 5000 ||
    photos.some((photo) => !(photo instanceof File)) ||
    photos.some(
      (photo) =>
        photo instanceof File &&
        (!allowedPhotoTypes.has(photo.type) || photo.size > maxPhotoSize)
    )
  ) {
    return NextResponse.json(
      { error: 'Please provide valid inspection details and photos.' },
      { status: 400 }
    )
  }

  const { data: wall, error: wallError } = await auth.supabase
    .from('walls')
    .select('id')
    .eq('id', wallId)
    .maybeSingle()

  if (wallError) {
    console.error('Inspection wall lookup error:', wallError)
    return NextResponse.json(
      { error: 'Unable to verify the selected wall.' },
      { status: 500 }
    )
  }

  if (!wall) {
    return NextResponse.json({ error: 'Selected wall not found.' }, { status: 404 })
  }

  const { data: inspection, error: inspectionError } = await auth.supabase
    .from('inspections')
    .insert({
      wall_id: wallId,
      condition,
      inspection_date: inspectionDate,
      notes: notes.trim() || null,
      inspected_by: auth.user.id,
    })
    .select('id')
    .single()

  if (inspectionError) {
    console.error('Inspection creation error:', inspectionError)
    return NextResponse.json(
      { error: 'Unable to save inspection.' },
      { status: 500 }
    )
  }

  const uploadedPaths: string[] = []

  for (const [index, item] of photos.entries()) {
    if (!(item instanceof File)) continue

    const extension = allowedPhotoTypes.get(item.type)
    if (!extension) continue

    const filePath = `${wallId}/${inspection.id}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await auth.supabase.storage
      .from('wall-photos')
      .upload(filePath, item, {
        cacheControl: '3600',
        upsert: false,
        contentType: item.type,
      })

    if (uploadError) {
      console.error(`Inspection photo ${index + 1} upload error:`, uploadError)
      await rollbackInspection(auth.supabase, inspection.id, uploadedPaths)
      return NextResponse.json(
        { error: 'A photo could not be uploaded. The inspection was not saved.' },
        { status: 500 }
      )
    }

    uploadedPaths.push(filePath)
    const { error: photoError } = await auth.supabase
      .from('wall_photos')
      .insert({
        wall_id: wallId,
        image_path: filePath,
        photo_type: 'inspection',
        caption: `Inspection photo - ${inspectionDate}`,
        uploaded_by: auth.user.id,
      })

    if (photoError) {
      console.error(`Inspection photo ${index + 1} record error:`, photoError)
      await rollbackInspection(auth.supabase, inspection.id, uploadedPaths)
      return NextResponse.json(
        { error: 'A photo could not be recorded. The inspection was not saved.' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ id: inspection.id }, { status: 201 })
}
