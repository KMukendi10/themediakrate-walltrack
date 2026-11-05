import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_DATE_PREFERENCES,
  formatAppDate,
  normalizeDatePreferences,
} from '../src/lib/date-format.ts'

test('formats date-only values without shifting calendar day by timezone', () => {
  assert.equal(
    formatAppDate('2025-01-31', {
      date_format: 'MM/DD/YYYY',
      timezone: 'America/Los_Angeles',
    }),
    '01/31/2025'
  )
})

test('applies the selected timezone to timestamps and includes local time', () => {
  assert.equal(
    formatAppDate(
      '2025-01-01T00:30:00.000Z',
      {
        date_format: 'DD/MM/YYYY',
        timezone: 'America/Los_Angeles',
      },
      true
    ),
    '31/12/2024 16:30'
  )
})

test('uses safe defaults for unsupported saved preferences', () => {
  assert.deepEqual(
    normalizeDatePreferences({
      date_format: 'YYYY/MM/DD',
      timezone: 'Invalid/Zone',
    }),
    DEFAULT_DATE_PREFERENCES
  )
})

test('reports invalid calendar dates instead of normalizing them', () => {
  assert.equal(
    formatAppDate('2025-02-30', DEFAULT_DATE_PREFERENCES),
    'Invalid date'
  )
})
