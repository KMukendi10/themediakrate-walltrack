
import Link from 'next/link'
import {
  Plus,
  Search,
  SlidersHorizontal,
  MapPin,
  MoreHorizontal,
  PanelsTopLeft,
} from 'lucide-react'

export default function WallsPage() {
  return (
    <main className="min-h-screen bg-[#111111] p-8 text-white">
      {/* Page heading */}
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-[#E7FF3C]">
            WORKSPACE / WALL MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Wall Management
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Register, organise and monitor advertising locations.
          </p>
        </div>

        <button className="flex items-center justify-center gap-2 rounded-lg bg-[#E7FF3C] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#d6ed28]">
          <Plus size={18} />
          Add New Wall
        </button>
      </div>

      {/* Statistics */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Walls', value: '0' },
          { label: 'Available', value: '0' },
          { label: 'Occupied', value: '0' },
          { label: 'Under Maintenance', value: '0' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-[#1B1B1B] p-5"
          >
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-[#E7FF3C]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Wall list */}
      <section className="rounded-xl border border-white/10 bg-[#1B1B1B]">
        <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-6 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-lg font-bold">Registered Walls</h2>
            <p className="mt-1 text-xs text-gray-500">
              Manage all advertising locations in one place.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#111111] px-4 py-2.5">
              <Search size={17} className="text-gray-500" />
              <input
                type="text"
                placeholder="Search walls..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-600 sm:w-48"
              />
            </div>

            <button className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/5">
              <SlidersHorizontal size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E7FF3C]/10 text-[#E7FF3C]">
            <PanelsTopLeft size={30} />
          </div>

          <h3 className="text-lg font-bold">No walls registered yet</h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
            Your registered advertising locations will appear here.
            Start by adding your first wall to WallTrack.
          </p>

          <button className="mt-6 flex items-center gap-2 rounded-lg bg-[#E7FF3C] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#d6ed28]">
            <Plus size={17} />
            Register First Wall
          </button>
        </div>
      </section>
    </main>
  )
}
