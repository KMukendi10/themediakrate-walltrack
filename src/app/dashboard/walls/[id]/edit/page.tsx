
import { Suspense } from 'react'
import EditWallForm from './EditWallForm'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

async function EditWallContent({ params }: PageProps) {
  const { id } = await params

  return <EditWallForm wallId={id} />
}

export default function EditWallPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] p-8 text-gray-400">
          Loading wall details...
        </div>
      }
    >
      <EditWallContent params={params} />
    </Suspense>
  )
}
