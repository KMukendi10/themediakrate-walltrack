const allowedConditions = ['excellent', 'good', 'fair', 'poor', 'damaged']
const allowedPhotoTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])
const maxPhotoSize = 10 * 1024 * 1024
const maxPhotoCount = 10
const maxTotalPhotoSize = 40 * 1024 * 1024

export type InspectionPhotoInput = {
  type: string
  size: number
}

export function isValidInspectionDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsedDate = new Date(`${value}T00:00:00.000Z`)
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  )
}

export function isValidInspectionSubmission(input: {
  wallId: unknown
  condition: unknown
  inspectionDate: unknown
  notes: unknown
  photos: readonly (InspectionPhotoInput | null)[]
}) {
  const { wallId, condition, inspectionDate, notes, photos } = input
  return (
    typeof wallId === 'string' &&
    wallId.length > 0 &&
    typeof condition === 'string' &&
    allowedConditions.includes(condition) &&
    typeof inspectionDate === 'string' &&
    isValidInspectionDate(inspectionDate) &&
    typeof notes === 'string' &&
    notes.length <= 5000 &&
    photos.length <= maxPhotoCount &&
    photos.every(
      (photo) =>
        photo !== null &&
        allowedPhotoTypes.has(photo.type) &&
        Number.isSafeInteger(photo.size) &&
        photo.size > 0 &&
        photo.size <= maxPhotoSize
    ) &&
    photos.reduce((total, photo) => total + (photo?.size ?? 0), 0) <=
      maxTotalPhotoSize
  )
}
