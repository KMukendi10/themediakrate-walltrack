import { Suspense } from 'react'
import EditProjectForm from './EditProjectForm'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

async function EditProjectContent({ params }: PageProps) {
  const { id } = await params

  return <EditProjectForm projectId={id} />
}

export default function EditProjectPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] p-8 text-gray-400">
          Loading project...
        </div>
      }
    >
      <EditProjectContent params={params} />
    </Suspense>
  )
}
