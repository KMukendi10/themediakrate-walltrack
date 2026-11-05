const projectStatuses = ['planning', 'active', 'completed', 'cancelled']

function isValidDate(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`)) &&
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value)
  )
}

export function parseProjectInput(body: unknown) {
  if (!body || typeof body !== 'object') return null

  const values = body as Record<string, unknown>
  const projectName =
    typeof values.project_name === 'string'
      ? values.project_name.trim()
      : ''
  const clientId =
    values.client_id === '' || values.client_id === null
      ? null
      : values.client_id
  const description =
    typeof values.description === 'string'
      ? values.description.trim() || null
      : null
  const startDate = values.start_date === '' ? null : values.start_date
  const endDate = values.end_date === '' ? null : values.end_date

  if (
    !projectName ||
    projectName.length > 200 ||
    (clientId !== null && typeof clientId !== 'string') ||
    (values.description !== '' &&
      values.description !== null &&
      typeof values.description !== 'string') ||
    typeof values.status !== 'string' ||
    !projectStatuses.includes(values.status) ||
    !isValidDate(startDate) ||
    !isValidDate(endDate) ||
    (startDate && endDate && endDate < startDate)
  ) {
    return null
  }

  return {
    project_name: projectName,
    client_id: clientId,
    description,
    status: values.status,
    start_date: startDate,
    end_date: endDate,
  }
}
