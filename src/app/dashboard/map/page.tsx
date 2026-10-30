
import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'
import { MapPin, Building2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import WallMap from '@/components/map/WallMap'

type MapPageProps = {
  searchParams: Promise<{
    wall?: string
  }>
}

type Wall = {
  id: string
  wall_code: string
  name: string
  latitude: number
  longitude: number
  address: string | null
  suburb: string | null
  city: string | null
  status: string
}

function MapLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111111] text-white">
      <p className="text-sm text-gray-400">
        Loading WallTrack map...
      </p>
    </div>
  )
}

async function MapContent({
  searchParams,
}: MapPageProps) {
  await connection()

  const params = await searchParams
  const selectedWallId = params.wall

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: wallsData, error } = await supabase
    .from('walls')
    .select(
      'id, wall_code, name, latitude, longitude, address, suburb, city, status'
    )
    .order('created_at', { ascending: false })

  const walls = (wallsData ?? []) as Wall[]

  const activeWalls = walls.filter(
    (wall) => wall.status === 'active'
  )

  const inactiveWalls = walls.filter(
    (wall) => wall.status !== 'active'
  )

  return (
    <div className="flex min-h-screen bg-[#111111] text-white">
      <Sidebar />

      <div className="min-w-0 flex-1">
        <Topbar email={user.email ?? 'Employee'} />

        <main className="p-6 lg:p-8">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
              LOCATION OVERVIEW
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Wall Map
            </h1>

            <p className="mt-2 text-sm text-gray-400">
              View and locate your registered advertising walls.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              Unable to load wall locations. Please refresh the page and try again.
            </div>
          )}

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#1B1B1B] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Total Locations
                </p>
                <MapPin size={19} className="text-[#E7FF3C]" />
              </div>

              <p className="mt-4 text-3xl font-bold text-[#E7FF3C]">
                {walls.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1B1B1B] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Active Walls
                </p>
                <Building2 size={19} className="text-green-400" />
              </div>

              <p className="mt-4 text-3xl font-bold text-green-400">
                {activeWalls.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#1B1B1B] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Other Statuses
                </p>
                <Building2 size={19} className="text-orange-400" />
              </div>

              <p className="mt-4 text-3xl font-bold text-orange-400">
                {inactiveWalls.length}
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">
                Wall Locations
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Select a marker to view its wall details.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E7FF3C]" />
                Registered wall
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1B1B1B]">
            <WallMap
              walls={walls}
              selectedWallId={selectedWallId}
            />
          </div>

          {walls.length === 0 && (
            <div className="mt-4 rounded-lg border border-white/10 bg-[#1B1B1B] p-4 text-sm text-gray-400">
              No walls have been registered yet. Add a wall to see its location on the map.
            </div>
          )}

          <p className="mt-4 text-xs text-gray-600">
            Map data is supplied by OpenStreetMap. Wall locations use the coordinates saved in WallTrack.
          </p>
        </main>
      </div>
    </div>
  )
}

export default function MapPage(props: MapPageProps) {
  return (
    <Suspense fallback={<MapLoading />}>
      <MapContent searchParams={props.searchParams} />
    </Suspense>
  )
}
