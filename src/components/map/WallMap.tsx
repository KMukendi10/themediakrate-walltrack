
'use client'

import { useEffect, useRef, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

export type WallMapProps = {
  walls: Wall[]
  selectedWallId?: string
}

const wallIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 34px;
      height: 34px;
      background: #E7FF3C;
      border: 3px solid #111111;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 12px rgba(0,0,0,0.4);
    ">
      <div style="
        width: 9px;
        height: 9px;
        background: #111111;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
})

function MapController({
  walls,
  selectedWallId,
}: WallMapProps) {
  const map = useMap()

  useEffect(() => {
    const handleFullscreenChange = () => {
      requestAnimationFrame(() => map.invalidateSize({ pan: false }))
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [map])

  useEffect(() => {
    if (selectedWallId) {
      const selectedWall = walls.find(
        (wall) => wall.id === selectedWallId
      )

      if (selectedWall) {
        map.flyTo(
          [selectedWall.latitude, selectedWall.longitude],
          16,
          { duration: 1 }
        )
        return
      }
    }

    if (walls.length > 0) {
      const bounds = L.latLngBounds(
        walls.map((wall) => [
          wall.latitude,
          wall.longitude,
        ])
      )

      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 })
    }
  }, [map, walls, selectedWallId])

  return null
}

export default function WallMap({
  walls,
  selectedWallId,
}: WallMapProps) {
  const mapShellRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenError, setFullscreenError] = useState('')

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === mapShellRef.current)
      setFullscreenError('')
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const defaultCenter: [number, number] =
    walls.length > 0
      ? [walls[0].latitude, walls[0].longitude]
      : [-26.2041, 28.0473]

  async function toggleFullscreen() {
    const mapShell = mapShellRef.current
    if (!mapShell) return

    setFullscreenError('')
    try {
      if (document.fullscreenElement === mapShell) {
        await document.exitFullscreen()
      } else if (mapShell.requestFullscreen) {
        await mapShell.requestFullscreen()
      } else {
        setFullscreenError('Fullscreen is not supported by this browser.')
      }
    } catch (error) {
      console.error('Map fullscreen error:', error)
      setFullscreenError('Unable to open the map in fullscreen.')
    }
  }

  return (
    <div
      ref={mapShellRef}
      className="walltrack-map-shell relative h-full min-h-[500px] overflow-hidden rounded-xl border border-white/10"
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? 'Exit fullscreen map' : 'View map fullscreen'}
        aria-pressed={isFullscreen}
        className="absolute right-3 top-3 z-[1000] inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#171717]/95 px-3 py-2 text-sm font-medium text-white shadow-lg transition hover:border-[#E7FF3C]/60 hover:text-[#E7FF3C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E7FF3C]"
      >
        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        <span>{isFullscreen ? 'Exit fullscreen' : 'Full screen'}</span>
      </button>
      {fullscreenError && (
        <p
          role="alert"
          className="absolute right-3 top-14 z-[1000] rounded-lg border border-red-500/30 bg-[#171717]/95 px-3 py-2 text-xs text-red-300 shadow-lg"
        >
          {fullscreenError}
        </p>
      )}
      <MapContainer
        center={defaultCenter}
        zoom={walls.length > 0 ? 12 : 10}
        scrollWheelZoom
        className="walltrack-dark-map h-full min-h-[500px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          walls={walls}
          selectedWallId={selectedWallId}
        />

        {walls.map((wall) => (
          <Marker
            key={wall.id}
            position={[wall.latitude, wall.longitude]}
            icon={wallIcon}
          >
            <Popup>
              <div className="min-w-[180px] text-black">
                <p className="text-xs font-semibold text-gray-500">
                  {wall.wall_code}
                </p>

                <h3 className="mt-1 text-sm font-bold">
                  {wall.name}
                </h3>

                <p className="mt-1 text-xs text-gray-600">
                  {[wall.address, wall.suburb, wall.city]
                    .filter(Boolean)
                    .join(', ') || 'No address recorded'}
                </p>

                <p className="mt-2 text-xs font-semibold">
                  Status: {wall.status.replaceAll('_', ' ')}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
