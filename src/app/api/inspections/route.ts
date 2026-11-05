import { NextResponse } from 'next/server'
import { authorizeRoles } from '@/lib/supabase/authorization'
import { isValidInspectionSubmission } from '@/lib/validation/inspection'

async function rollbackInspection(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  inspectionId: string,
  uploadedPaths: string[]
): Promise<boolean> {
  if (uploadedPaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('wall-photos')
      .remove(uploadedPaths)

    if (storageError) {
      console.error('Inspection photo storage rollback error:', storageError)
      return false
    }

    const { error: metadataError } = await supabase
      .from('wall_photos')
      .delete()
      .in('image_path', uploadedPaths)

    if (metadataError) {
      console.error('Inspection photo metadata rollback error:', metadataError)
      return false
    }
  }

  const { error } = await supabase
    .from('inspections')
    .delete()
    .eq('id', inspectionId)

  if (error) {
    console.error('Inspection record rollback error:', error)
    return false
  }

  return true
}

export async function POST(request: Request) {
  const auth = await authorizeRoles(['admin', 'employee'])
  if (!auth.authorized) return auth.response
  const supabase = auth.supabase

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

  const photoInputs = photos.map((photo) =>
    photo instanceof File ? { type: photo.type, size: photo.size } : null
  )
  if (
    !isValidInspectionSubmission({
      wallId,
      condition,
      inspectionDate,
      notes,
      photos: photoInputs,
    })
  ) {
    return NextResponse.json(
      { error: 'Please provide valid inspection details and photos.' },
      { status: 400 }
    )
  }

  const notesText = typeof notes === 'string' ? notes.trim() : ''
  const { data: wall, error: wallError } = await supabase
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

  const { data: inspection, error: inspectionError } = await supabase
    .from('inspections')
    .insert({
      wall_id: wallId,
      condition,
      inspection_date: inspectionDate,
      notes: notesText || null,
      inspected_by: auth.user.id,
    })
    .select('id')
    .single()

  if (inspectionError || !inspection) {
    console.error('Inspection creation error:', inspectionError)
    return NextResponse.json(
      { error: 'Unable to save inspection.' },
      { status: 500 }
    )
  }

  const inspectionId = inspection.id
  const uploadedPaths: string[] = []

  async function failAfterPartialSave(message: string) {
    const cleanedUp = await rollbackInspection(
      supabase,
      inspectionId,
      uploadedPaths
    )

    return NextResponse.json(
      {
        error: cleanedUp
          ? message
          : `The submission could not be completed and automatic cleanup was incomplete. Check inspection ${inspectionId} and its photos before retrying.`,
        inspectionId: cleanedUp ? undefined : inspectionId,
      },
      { status: 500 }
    )
  }

  for (const [index, item] of photos.entries()) {
    if (!(item instanceof File)) continue

    const extension =
      item.type === 'image/jpeg'
        ? 'jpg'
        : item.type === 'image/png'
          ? 'png'
          : item.type === 'image/webp'
            ? 'webp'
            : null
    if (!extension) {
      return await failAfterPartialSave(
        'An uploaded photo has an unsupported file type. Please use JPEG, PNG, or WebP.'
      )
    }

    const filePath = `${wallId}/${inspectionId}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage
      .from('wall-photos')
      .upload(filePath, item, {
        cacheControl: '3600',
        upsert: false,
        contentType: item.type,
      })

    if (uploadError) {
      console.error(`Inspection ${inspectionId} photo ${index + 1} upload error:`, uploadError)
      return failAfterPartialSave(
        'A photo could not be uploaded. The inspection was not saved; check the selected files and try again.'
      )
    }

    uploadedPaths.push(filePath)
    const { error: photoError } = await supabase
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
      return failAfterPartialSave(
        'A photo record could not be saved. The inspection was not saved; check the selected files and try again.'
      )
    }
  }

  return NextResponse.json({ id: inspectionId }, { status: 201 })
}
