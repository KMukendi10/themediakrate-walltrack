
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  LocateFixed,
  Loader2,
  MapPin,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Props = {
  wallId: string
}

const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none focus:border-[#E7FF3C]'

const labelClass = 'mb-2 block text-sm text-gray-300'

export default function EditWallForm({ wallId }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationError, setLocationError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const [form, setForm] = useState({
    wall_code: '',
    name: '',
    description: '',
    wall_type: '',
    address: '',
    suburb: '',
    city: '',
    province: '',
    postal_code: '',
    latitude: '',
    longitude: '',
    location_method: 'manual',
    gps_accuracy: '',
    width_m: '',
    height_m: '',
    status: 'active',
  })

  useEffect(() => {
    async function loadWall() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.replace('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError || profile?.role !== 'admin') {
        setError('Only administrators can edit advertising wall details.')
        setLoading(false)
        return
      }

      setIsAdmin(true)

      const { data: wall, error: wallError } = await supabase
        .from('walls')
        .select('*')
        .eq('id', wallId)
        .maybeSingle()

      if (wallError || !wall) {
        setError(wallError?.message || 'Wall could not be found.')
        setLoading(false)
        return
      }

      setForm({
        wall_code: wall.wall_code ?? '',
        name: wall.name ?? '',
        description: wall.description ?? '',
        wall_type: wall.wall_type ?? '',
        address: wall.address ?? '',
        suburb: wall.suburb ?? '',
        city: wall.city ?? '',
        province: wall.province ?? '',
        postal_code: wall.postal_code ?? '',
        latitude: String(wall.latitude ?? ''),
        longitude: String(wall.longitude ?? ''),
        location_method: wall.location_method ?? 'manual',
        gps_accuracy:
          wall.gps_accuracy !== null && wall.gps_accuracy !== undefined
            ? String(wall.gps_accuracy)
            : '',
        width_m:
          wall.width_m !== null && wall.width_m !== undefined
            ? String(wall.width_m)
            : '',
        height_m:
          wall.height_m !== null && wall.height_m !== undefined
            ? String(wall.height_m)
            : '',
        status: wall.status ?? 'active',
      })

      setLoading(false)
    }

    loadWall()
  }, [wallId, router, supabase])

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function captureLocation() {
    if (!navigator.geolocation) {
      setLocationError('Your browser does not support GPS location.')
      return
    }

    setGpsLoading(true)
    setLocationError('')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((current) => ({
          ...current,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
          location_method: 'gps',
          gps_accuracy: position.coords.accuracy.toString(),
        }))

        setGpsLoading(false)
      },
      (gpsError) => {
        setGpsLoading(false)

        if (gpsError.code === gpsError.PERMISSION_DENIED) {
          setLocationError('Location permission was denied.')
        } else if (gpsError.code === gpsError.POSITION_UNAVAILABLE) {
          setLocationError('Your current location could not be determined.')
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

  function useManualCoordinates() {
    setForm((current) => ({
      ...current,
      location_method: 'manual',
      gps_accuracy: '',
    }))
    setLocationError('')
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!isAdmin) {
      setError('Only administrators can edit advertising walls.')
      return
    }

    const latitude = Number(form.latitude)
    const longitude = Number(form.longitude)
    const width = form.width_m === '' ? null : Number(form.width_m)
    const height = form.height_m === '' ? null : Number(form.height_m)
    const accuracy =
      form.gps_accuracy === '' ? null : Number(form.gps_accuracy)

    if (!form.name.trim()) {
      setError('Please enter a wall name.')
      return
    }

    if (
      form.latitude === '' ||
      form.longitude === '' ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90 ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError('Please enter valid latitude and longitude coordinates.')
      return
    }

    if (
      (width !== null && (!Number.isFinite(width) || width < 0)) ||
      (height !== null && (!Number.isFinite(height) || height < 0)) ||
      (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0))
    ) {
      setError('Please enter valid non-negative measurements.')
      return
    }

    setSaving(true)

    const response = await fetch(`/api/walls/${wallId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        description: form.description.trim() || null,
        wall_type: form.wall_type || null,
        address: form.address.trim() || null,
        suburb: form.suburb.trim() || null,
        city: form.city.trim() || null,
        province: form.province || null,
        postal_code: form.postal_code.trim() || null,
        latitude,
        longitude,
        location_method: form.location_method,
        gps_accuracy: accuracy,
        width_m: width,
        height_m: height,
        status: form.status,
      }),
    })
    const result = await response.json()

    if (!response.ok) {
      setError(result.error ?? 'Unable to update this wall.')
      setSaving(false)
      return
    }

    router.push(`/dashboard/walls/${wallId}?success=Wall updated successfully`)
    router.refresh()
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#111111] text-gray-400">
        Loading wall details...
      </main>
    )
  }

  if (error && !isAdmin) {
    return (
      <main className="min-h-screen bg-[#111111] p-8 text-white">
        <div className="mx-auto max-w-3xl rounded-xl border border-red-500/20 bg-red-500/10 p-6">
          <p className="text-red-400">{error}</p>
          <Link
            href={`/dashboard/walls/${wallId}`}
            className="mt-5 inline-flex text-sm text-[#E7FF3C] hover:underline"
          >
            Back to Wall Details
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#111111] p-6 text-white md:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/dashboard/walls/${wallId}`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-[#E7FF3C]"
        >
          <ArrowLeft size={16} />
          Back to Wall Details
        </Link>

        <div className="mb-8">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
            WALL MANAGEMENT / EDIT
          </p>

          <h1 className="mt-2 text-3xl font-bold">Edit Wall Details</h1>

          <p className="mt-2 text-sm text-gray-400">
            Update the information recorded for this advertising location.
          </p>

          <p className="mt-3 text-sm text-[#E7FF3C]">
            Wall Code: {form.wall_code}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
            <h2 className="text-lg font-bold">Basic Information</h2>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Wall Name *</label>
                <input
                  required
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Wall Type</label>
                <select
                  className={inputClass}
                  value={form.wall_type}
                  onChange={(e) => updateField('wall_type', e.target.value)}
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
                <label className={labelClass}>Width (metres)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={form.width_m}
                  onChange={(e) => updateField('width_m', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Height (metres)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={inputClass}
                  value={form.height_m}
                  onChange={(e) => updateField('height_m', e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelClass}>Description / Notes</label>
                <textarea
                  rows={4}
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
            <div className="flex items-center gap-3">
              <MapPin size={20} className="text-[#E7FF3C]" />
              <h2 className="text-lg font-bold">Location Details</h2>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Physical Address</label>
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Suburb</label>
                <input
                  className={inputClass}
                  value={form.suburb}
                  onChange={(e) => updateField('suburb', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>City</label>
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>Province</label>
                <select
                  className={inputClass}
                  value={form.province}
                  onChange={(e) => updateField('province', e.target.value)}
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
                <label className={labelClass}>Postal Code</label>
                <input
                  className={inputClass}
                  value={form.postal_code}
                  onChange={(e) => updateField('postal_code', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="font-semibold">GPS Coordinates *</h3>

              <p className="mt-1 text-sm text-gray-500">
                Only capture your current GPS location if you are physically
                at the actual advertising wall.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={captureLocation}
                  disabled={gpsLoading}
                  className="flex items-center gap-2 rounded-lg bg-[#E7FF3C] px-4 py-3 text-sm font-bold text-black disabled:opacity-60"
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
                  onClick={useManualCoordinates}
                  className="rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-gray-300 hover:border-[#E7FF3C]"
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
                  <label className={labelClass}>Latitude *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="-90"
                    max="90"
                    className={inputClass}
                    value={form.latitude}
                    onChange={(e) => {
                      updateField('latitude', e.target.value)
                      updateField('location_method', 'manual')
                      updateField('gps_accuracy', '')
                    }}
                  />
                </div>

                <div>
                  <label className={labelClass}>Longitude *</label>
                  <input
                    required
                    type="number"
                    step="any"
                    min="-180"
                    max="180"
                    className={inputClass}
                    value={form.longitude}
                    onChange={(e) => {
                      updateField('longitude', e.target.value)
                      updateField('location_method', 'manual')
                      updateField('gps_accuracy', '')
                    }}
                  />
                </div>
              </div>

              <p className="mt-4 text-xs text-gray-500">
                Location method: {form.location_method === 'gps' ? 'GPS capture' : 'Manual entry'}
                {form.gps_accuracy &&
                  ` · Accuracy: approximately ${Math.round(Number(form.gps_accuracy))} metres`}
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#1B1B1B] p-6">
            <h2 className="text-lg font-bold">Wall Status</h2>

            <div className="mt-5">
              <label className={labelClass}>Current Status *</label>
              <select
                required
                className={inputClass}
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="removed">Removed</option>
              </select>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <Link
              href={`/dashboard/walls/${wallId}`}
              className="rounded-lg border border-white/10 px-6 py-3 text-center text-sm font-semibold text-gray-300 hover:bg-white/5"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#E7FF3C] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#d6ed28] disabled:opacity-60"
            >
              <Save size={17} />
              {saving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
