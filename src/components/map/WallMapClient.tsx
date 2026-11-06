'use client'

import dynamic from 'next/dynamic'

import type { WallMapProps } from './WallMap'

const WallMap = dynamic(() => import('./WallMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[500px] items-center justify-center bg-[#1B1B1B] text-sm text-gray-500">
      Loading map...
    </div>
  ),
})

export default function WallMapClient(props: WallMapProps) {
  return <WallMap {...props} />
}
