import { Suspense } from 'react'
import EditProjectForm from './EditProjectForm'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] p-8 text-gray-400">
          Loading project...
        </div>
      }
    >
      <EditProjectForm projectId={id} />
    </Suspense>
  )
}
