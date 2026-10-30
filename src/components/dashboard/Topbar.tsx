
import { Bell, Search, UserCircle } from 'lucide-react'

type TopbarProps = {
  email: string
}

export default function Topbar({ email }: TopbarProps) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 bg-[#171717] px-8">
      <div>
        <p className="text-xs text-gray-500">
          MEDIA KRATE / WORKSPACE
        </p>
        <h2 className="mt-1 text-lg font-bold text-white">
          WallTrack Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-3 rounded-lg border border-white/10 bg-[#202020] px-4 py-2 md:flex">
          <Search size={16} className="text-gray-500" />
          <span className="text-xs text-gray-500">
            Search workspace...
          </span>
          <span className="rounded bg-white/10 px-2 py-1 text-[10px] text-gray-400">
            ⌘ K
          </span>
        </div>

        <button
          type="button"
          className="relative text-gray-400 transition hover:text-white"
          aria-label="Notifications"
        >
          <Bell size={19} />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#E7FF3C]" />
        </button>

        <div className="flex items-center gap-3 border-l border-white/10 pl-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E7FF3C]/10 text-[#E7FF3C]">
            <UserCircle size={20} />
          </div>

          <div className="hidden sm:block">
            <p className="max-w-44 truncate text-xs font-semibold text-white">
              {email}
            </p>
            <p className="mt-1 text-[10px] text-gray-500">
              Employee account
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
