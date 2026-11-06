import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

const storageBucket = 'wall-photos'

export async function removeStorageTree(
  supabase: SupabaseClient,
  prefix: string
): Promise<{ removedCount: number; error: string | null }> {
  const paths: string[] = []
  const folders = [prefix]

  while (folders.length > 0) {
    const folder = folders.pop()
    if (!folder) continue

    let offset = 0
    while (true) {
      const { data, error } = await supabase.storage
        .from(storageBucket)
        .list(folder, { limit: 1000, offset })

      if (error) {
        console.error('Storage cleanup listing error:', error)
        return {
          removedCount: 0,
          error: 'Could not list all stored photos. No database records were deleted.',
        }
      }

      for (const item of data) {
        const path = `${folder}/${item.name}`
        if (item.id === null) {
          folders.push(path)
        } else {
          paths.push(path)
        }
      }

      if (data.length < 1000) break
      offset += data.length
    }
  }

  let removedCount = 0
  for (let index = 0; index < paths.length; index += 100) {
    const batch = paths.slice(index, index + 100)
    const { error } = await supabase.storage
      .from(storageBucket)
      .remove(batch)

    if (error) {
      console.error('Storage cleanup removal error:', error)
      return {
        removedCount,
        error: 'Some photos could not be removed. Database records were left in place; retry deletion.',
      }
    }
    removedCount += batch.length
  }

  return { removedCount, error: null }
}
