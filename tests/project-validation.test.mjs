import assert from 'node:assert/strict'
import test from 'node:test'
import { parseProjectInput } from '../src/lib/validation/project.ts'

test('trims valid project values and accepts leap-day dates', () => {
  assert.deepEqual(
    parseProjectInput({
      project_name: '  Spring Campaign  ',
      client_id: '',
      description: '  Outdoor media  ',
      status: 'planning',
      start_date: '2024-02-29',
      end_date: '2024-03-01',
    }),
    {
      project_name: 'Spring Campaign',
      client_id: null,
      description: 'Outdoor media',
      status: 'planning',
      start_date: '2024-02-29',
      end_date: '2024-03-01',
    }
  )
})

test('rejects invalid status, invalid dates, and reversed date ranges', () => {
  const validProject = {
    project_name: 'Campaign',
    client_id: null,
    description: null,
    status: 'planning',
    start_date: '2025-02-01',
    end_date: '2025-02-02',
  }

  assert.equal(
    parseProjectInput({ ...validProject, status: 'unknown' }),
    null
  )
  assert.equal(
    parseProjectInput({ ...validProject, start_date: '2025-02-30' }),
    null
  )
  assert.equal(
    parseProjectInput({
      ...validProject,
      start_date: '2025-03-02',
      end_date: '2025-03-01',
    }),
    null
  )
})
