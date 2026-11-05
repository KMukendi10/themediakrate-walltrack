export const SUPPORTED_DASHBOARD_PAGES = [
  '/dashboard',
  '/dashboard/walls',
  '/dashboard/map',
  '/dashboard/projects',
  '/dashboard/inspections',
] as const

export function isSupportedDashboardPage(
  value: unknown
): value is (typeof SUPPORTED_DASHBOARD_PAGES)[number] {
  return (
    typeof value === 'string' &&
    SUPPORTED_DASHBOARD_PAGES.some((page) => page === value)
  )
}
