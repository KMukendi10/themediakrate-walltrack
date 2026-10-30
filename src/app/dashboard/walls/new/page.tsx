
'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  ArrowLeft,
  MapPin,
  Save,
  LocateFixed,
  Loader2,
} from 'lucide-react'
import { createWall } from './actions'

export default function NewWallPage() {
  const [locationMethod, setLocationMethod] = useState<'gps' | 'manual'>('manual')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [gpsAccuracy, setGpsAccuracy] = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [locationError, setLocationError] = useState('')

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support GPS location.')
      return
    }

    setGpsLoading(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString())
        setLongitude(position.coords.longitude.toString())
        setGpsAccuracy(position.coords.accuracy.toString())
        setLocationMethod('gps')
        setGpsLoading(false)
      },
      (error) => {
        setGpsLoading(false)

        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('Location permission was denied. Please allow location access in your browser.')
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('Your current location could not be determined. Try manual entry.')
        } else {
          setLocationError('GPS request timed out. Please try again.')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  function handleManualLocation() {
    setLocationMethod('manual')
    setGpsAccuracy('')
    setLocationError('')
  }

  return (
    <main className="min-h-screen bg-[#111111] p-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard/walls"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#E7FF3C]"
        >
          <ArrowLeft size={16} />
          Back to Wall Management
        </Link>

        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
            WALL MANAGEMENT / REGISTER
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Register New Wall
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Add a new advertising location to the WallTrack system.
          </p>
        </div>

        <form action={createWall} className="space-y-8">
          {/* Basic information */}
          <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
            <h2 className="text-lg font-bold">Basic Information</h2>
            <p className="mt-1 text-sm text-gray-500">
              Enter the identifying details of the advertising wall.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Wall Name *
                </label>
                <input
                  required
                  name="name"
                  type="text"
                  placeholder="e.g. Main Road Billboard"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Wall Type
                </label>
                <select
                  name="wall_type"
                  defaultValue=""
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm text-gray-300 outline-none focus:border-[#E7FF3C]"
                >
                  <option value="">Select wall type</option>
                  <option value="billboard">Billboard</option>
                  <option value="wall_mural">Wall Mural</option>
                  <option value="building_wrap">Building Wrap</option>
                  <option value="shop_front">Shop Front</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Wall Width (metres)
                </label>
                <input
                  name="width_m"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 12"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Wall Height (metres)
                </label>
                <input
                  name="height_m"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 6"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
                />
              </div>
            </div>
          </section>

          {/* Location details */}
          <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
            <div className="flex items-center gap-3">
              <MapPin className="text-[#E7FF3C]" size={20} />
              <div>
                <h2 className="text-lg font-bold">Location Details</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Enter the address and capture the wall's coordinates.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm text-gray-300">
                  Physical Address
                </label>
                <input
                  name="address"
                  type="text"
                  placeholder="Street address or nearby landmark"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Suburb
                </label>
                <input
                  name="suburb"
                  type="text"
                  placeholder="e.g. Sandton"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  City
                </label>
                <input
                  name="city"
                  type="text"
                  placeholder="e.g. Johannesburg"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Province
                </label>
                <select
                  name="province"
                  defaultValue=""
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm text-gray-300 outline-none focus:border-[#E7FF3C]"
                >
                  <option value="">Select province</option>
                  <option>Eastern Cape</option>
                  <option>Free State</option>
                  <option>Gauteng</option>
                  <option>KwaZulu-Natal</option>
                  <option>Limpopo</option>
                  <option>Mpumalanga</option>
                  <option>Northern Cape</option>
                  <option>North West</option>
                  <option>Western Cape</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Postal Code
                </label>
                <input
                  name="postal_code"
                  type="text"
                  placeholder="e.g. 2196"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
                />
              </div>
            </div>

            {/* Location capture */}
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="font-semibold">GPS Coordinates *</h3>
              <p className="mt-1 text-sm text-gray-500">
                Capture the wall's position using GPS or enter its coordinates manually.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={gpsLoading}
                  className="flex items-center gap-2 rounded-lg bg-[#E7FF3C] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#d6ed28] disabled:opacity-60"
                >
                  {gpsLoading ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : (
                    <LocateFixed size={17} />
                  )}
                  {gpsLoading ? 'Getting location...' : 'Use Current Location'}
                </button>

                <button
                  type="button"
                  onClick={handleManualLocation}
                  className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                    locationMethod === 'manual'
                      ? 'border-[#E7FF3C] text-[#E7FF3C]'
                      : 'border-white/10 text-gray-300 hover:bg-white/5'
                  }`}
                >
                  Enter Manually
                </button>
              </div>

              {locationError && (
                <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                  {locationError}
                </p>
              )}

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Latitude *
                  </label>
                  <input
                    required
                    name="latitude"
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    value={latitude}
                    onChange={(event) => {
                      setLatitude(event.target.value)
                      setLocationMethod('manual')
                      setGpsAccuracy('')
                    }}
                    placeholder="-26.2041"
                    className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-300">
                    Longitude *
                  </label>
                  <input
                    required
                    name="longitude"
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    value={longitude}
                    onChange={(event) => {
                      setLongitude(event.target.value)
                      setLocationMethod('manual')
                      setGpsAccuracy('')
                    }}
                    placeholder="28.0473"
                    className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
                  />
                </div>
              </div>

              <input
                type="hidden"
                name="location_method"
                value={locationMethod}
              />

              <input
                type="hidden"
                name="gps_accuracy"
                value={gpsAccuracy}
              />

              <p className="mt-4 text-xs text-gray-500">
                Location method: {locationMethod === 'gps' ? 'GPS capture' : 'Manual entry'}
                {gpsAccuracy && ` · Accuracy: approximately ${Math.round(Number(gpsAccuracy))} metres`}
              </p>
            </div>
          </section>

          {/* Additional details */}
          <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
            <h2 className="text-lg font-bold">Additional Details</h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Wall Status *
                </label>
                <select
                  required
                  name="status"
                  defaultValue="active"
                  className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm text-gray-300 outline-none focus:border-[#E7FF3C]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="under_maintenance">Under Maintenance</option>
                  <option value="removed">Removed</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Description / Notes
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Add any relevant information about this wall..."
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm outline-none focus:border-[#E7FF3C]"
                />
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link
              href="/dashboard/walls"
              className="rounded-lg border border-white/10 px-6 py-3 text-center text-sm font-semibold text-gray-300 transition hover:bg-white/5"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-lg bg-[#E7FF3C] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#d6ed28]"
            >
              <Save size={17} />
              Save Wall
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
