
'use client'

import { useEffect, useState } from 'react'
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

type WallMapProps = {
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
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    setMapReady(true)
  }, [])

  if (!mapReady) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center bg-[#1B1B1B] text-sm text-gray-500">
        Loading map...
      </div>
    )
  }

  const defaultCenter: [number, number] =
    walls.length > 0
      ? [walls[0].latitude, walls[0].longitude]
      : [-26.2041, 28.0473]

  return (
    <div className="h-full min-h-[500px] overflow-hidden rounded-xl border border-white/10">
      <MapContainer
        center={defaultCenter}
        zoom={walls.length > 0 ? 12 : 10}
        scrollWheelZoom
        className="h-full min-h-[500px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
