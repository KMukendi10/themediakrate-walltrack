import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidInspectionSubmission } from '../src/lib/validation/inspection.ts'

const validInspection = {
  wallId: 'wall-1',
  condition: 'good',
  inspectionDate: '2025-01-31',
  notes: 'Looks good',
  photos: [{ type: 'image/jpeg', size: 1024 }],
}

test('accepts valid inspection details and supported photo metadata', () => {
  assert.equal(isValidInspectionSubmission(validInspection), true)
})

test('rejects invalid dates, unsupported photos, and excessive uploads', () => {
  assert.equal(
    isValidInspectionSubmission({
      ...validInspection,
      inspectionDate: '2025-02-30',
    }),
    false
  )
  assert.equal(
    isValidInspectionSubmission({
      ...validInspection,
      photos: [{ type: 'image/gif', size: 100 }],
    }),
    false
  )
  assert.equal(
    isValidInspectionSubmission({
      ...validInspection,
      photos: Array.from({ length: 11 }, () => ({
        type: 'image/jpeg',
        size: 1024,
      })),
    }),
    false
  )
  assert.equal(
    isValidInspectionSubmission({
      ...validInspection,
      photos: [
        { type: 'image/jpeg', size: 10 * 1024 * 1024 },
        { type: 'image/png', size: 10 * 1024 * 1024 },
        { type: 'image/webp', size: 10 * 1024 * 1024 },
        { type: 'image/jpeg', size: 10 * 1024 * 1024 + 1 },
      ],
    }),
    false
  )
})
