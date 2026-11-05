
import { UserCircle } from 'lucide-react'
import WorkspaceSearch from './WorkspaceSearch'
import RecentUpdates from './RecentUpdates'

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
        <WorkspaceSearch />
        <RecentUpdates />

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
