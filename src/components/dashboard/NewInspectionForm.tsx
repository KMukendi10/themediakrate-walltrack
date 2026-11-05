
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Camera,
  X,
  Upload,
  Loader2,
  ClipboardCheck,
} from 'lucide-react'

type Wall = {
  id: string
  wall_code: string
  name: string
  suburb: string | null
  city: string | null
  status: string
}

type Props = {
  walls: Wall[]
  userId: string
}

const conditions = [
  { value: 'excellent', label: 'Excellent', description: 'Wall is in excellent condition.' },
  { value: 'good', label: 'Good', description: 'Minor wear, no major issues.' },
  { value: 'fair', label: 'Fair', description: 'Some maintenance may be required.' },
  { value: 'poor', label: 'Poor', description: 'Significant maintenance required.' },
  { value: 'damaged', label: 'Damaged', description: 'Wall has visible damage.' },
]

export default function NewInspectionForm({ walls, userId }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [wallId, setWallId] = useState('')
  const [condition, setCondition] = useState('good')
  const [inspectionDate, setInspectionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [notes, setNotes] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  function handlePhotoSelection(files: FileList | null) {
    if (!files) return

    const selectedFiles = Array.from(files)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    const invalidFile = selectedFiles.find(
      (file) => !allowedTypes.includes(file.type)
    )

    if (invalidFile) {
      setError('Only JPG, PNG and WEBP images are allowed.')
      return
    }

    const oversizedFile = selectedFiles.find(
      (file) => file.size > 10 * 1024 * 1024
    )

    if (oversizedFile) {
      setError('Each photo must be smaller than 10MB.')
      return
    }

    setError('')

    setPhotos((current) => {
      const combined = [...current, ...selectedFiles]
      return combined.filter(
        (file, index) =>
          combined.findIndex(
            (item) =>
              item.name === file.name &&
              item.size === file.size &&
              item.lastModified === file.lastModified
          ) === index
      )
    })
  }

  function removePhoto(index: number) {
    setPhotos((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!wallId) {
      setError('Please select a wall.')
      return
    }

    setLoading(true)

    try {
      const { data: inspection, error: inspectionError } = await supabase
        .from('inspections')
        .insert({
          wall_id: wallId,
          condition,
          inspection_date: inspectionDate,
          notes: notes.trim() || null,
          inspected_by: userId,
        })
        .select('id')
        .single()

      if (inspectionError) throw inspectionError

      for (let index = 0; index < photos.length; index++) {
        const photo = photos[index]
        const extension = photo.name.split('.').pop()?.toLowerCase() || 'jpg'
        const filePath = `${wallId}/${inspection.id}/${Date.now()}-${index}.${extension}`

        setUploadProgress(`Uploading photo ${index + 1} of ${photos.length}...`)

        const { error: uploadError } = await supabase.storage
          .from('wall-photos')
          .upload(filePath, photo, {
            cacheControl: '3600',
            upsert: false,
            contentType: photo.type,
          })

        if (uploadError) throw uploadError

        const { error: photoError } = await supabase
          .from('wall_photos')
          .insert({
            wall_id: wallId,
            image_path: filePath,
            photo_type: 'inspection',
            caption: `Inspection photo - ${inspectionDate}`,
            uploaded_by: userId,
          })

        if (photoError) throw photoError
      }

      router.push('/dashboard/inspections?success=Inspection%20recorded%20successfully')
      router.refresh()
    } catch (err) {
      console.error('Inspection submission error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while saving the inspection.'
      )
    } finally {
      setLoading(false)
      setUploadProgress('')
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-[#1B1B1B] p-6 md:p-8 space-y-7"
    >
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Select Wall <span className="text-red-400">*</span>
        </label>

        <select
          required
          value={wallId}
          onChange={(e) => setWallId(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none focus:border-[#E7FF3C]"
        >
          <option value="">Choose a wall</option>
          {walls.map((wall) => (
            <option key={wall.id} value={wall.id}>
              {wall.wall_code} - {wall.name}
              {wall.suburb ? ` (${wall.suburb})` : ''}
            </option>
          ))}
        </select>

        {walls.length === 0 && (
          <p className="text-sm text-amber-400 mt-2">
            No registered walls were found.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Wall Condition <span className="text-red-400">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {conditions.map((item) => (
            <label
              key={item.value}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                condition === item.value
                  ? 'border-[#E7FF3C] bg-[#E7FF3C]/10'
                  : 'border-white/10 bg-[#111111] hover:border-white/30'
              }`}
            >
              <input
                type="radio"
                name="condition"
                value={item.value}
                checked={condition === item.value}
                onChange={() => setCondition(item.value)}
                className="sr-only"
              />

              <div className="font-semibold text-white">{item.label}</div>
              <p className="text-xs text-gray-400 mt-1">
                {item.description}
              </p>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Inspection Date <span className="text-red-400">*</span>
        </label>

        <input
          type="date"
          required
          value={inspectionDate}
          onChange={(e) => setInspectionDate(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none focus:border-[#E7FF3C]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Inspection Notes
        </label>

        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe the wall's condition, visible issues or maintenance requirements..."
          className="w-full resize-y rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-[#E7FF3C]"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Inspection Photos
        </label>

        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/15 bg-[#111111] p-8 text-center transition hover:border-[#E7FF3C]/60">
          <Camera size={30} className="text-[#E7FF3C] mb-3" />
          <span className="text-sm font-medium text-white">
            Click to upload photos
          </span>
          <span className="text-xs text-gray-500 mt-2">
            JPG, PNG or WEBP · Maximum 10MB per photo
          </span>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              handlePhotoSelection(e.target.files)
              e.target.value = ''
            }}
            className="hidden"
          />
        </label>

        {photos.length > 0 && (
          <div className="mt-4 space-y-2">
            {photos.map((photo, index) => (
              <div
                key={`${photo.name}-${photo.lastModified}-${index}`}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-[#111111] p-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Camera size={18} className="text-[#E7FF3C] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-white truncate">{photo.name}</p>
                    <p className="text-xs text-gray-500">
                      {(photo.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="text-gray-400 hover:text-red-400 p-2"
                  aria-label={`Remove ${photo.name}`}
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6">
        <p className="text-xs text-gray-500">
          Fields marked with * are required.
        </p>

        <button
          type="submit"
          disabled={loading || walls.length === 0}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-[#E7FF3C] px-6 py-3 font-semibold text-black transition hover:bg-[#d5ed32] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {uploadProgress || 'Saving inspection...'}
            </>
          ) : (
            <>
              <ClipboardCheck size={18} />
              Save Inspection
              <Upload size={16} />
            </>
          )}
        </button>
      </div>
    </form>
  )
}
