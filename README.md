# WallTrack

WallTrack is a prototype for managing advertising walls, their locations, projects, inspections, inspection photos, and employee accounts. It uses a dark interface with lime accents and is built with Next.js, React, TypeScript, and Supabase.

## Requirements

- Node.js 22.6 or newer (Next.js requires Node.js 20.9 or newer; the test command uses Node's TypeScript stripping support).
- npm.
- A Supabase project configured for the application's schema, Auth, and Storage.

## Local development

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create `.env.local` in the repository root and provide these variables:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SECRET_KEY=
   ```

   Use the publishable key in browser/server session clients. `SUPABASE_SECRET_KEY` is used only by the server-side Supabase Admin client for employee invitations and cleanup. Never prefix it with `NEXT_PUBLIC_` or expose it to browser code.

3. Start the development server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`. The root route sends the visitor to the dashboard, which requires an authenticated session and redirects unauthenticated users to `/login`.

## Useful commands

```bash
npm run dev
npm test
npm run lint
npm run build
npm start
```

The tests cover date/time formatting, project input validation, and inspection/photo validation. They are unit tests; they do not exercise a live Supabase project or browser workflows.

## Application routes

| Route | Purpose |
|---|---|
| `/` | Redirects to the dashboard. |
| `/login` | Authenticated employee sign-in. |
| `/dashboard` | Data-backed workspace summary and recent inspections. |
| `/dashboard/walls` | Wall directory; `/new`, `/[id]`, and `/[id]/edit` support registration, details, and editing. Administrators can permanently delete a wall and its assignments, inspections, and stored photos. |
| `/dashboard/map` | Map of walls with coordinates. |
| `/dashboard/projects` | Project directory; `/new`, `/[id]`, and `/[id]/edit` support project and wall-assignment management. Administrators can permanently delete a project and its wall assignments. |
| `/dashboard/inspections` | Inspection history; `/new` and `/[id]` support recording and review. Administrators can permanently delete an inspection and its stored photos. |
| `/dashboard/employees` | Employee directory; `/new`, `/[id]`, and `/[id]/edit` are administrator-only. Administrators can permanently delete another account while retaining anonymized inspection history. |
| `/dashboard/settings` | Settings hub. |
| `/dashboard/settings/account` | Administrator account profile settings. |
| `/dashboard/settings/company` | Administrator company profile settings. |
| `/dashboard/settings/roles` | Administrator role information. |
| `/dashboard/settings/security` | Administrator password change. |
| `/dashboard/settings/preferences` | Personal display and dashboard preferences. |

The sidebar contains the primary workspace links; employee and settings pages enforce their role restrictions on the server as well as through the interface.

## Data model and Supabase

The application code accesses these Postgres tables: `profiles`, `user_preferences`, `clients`, `company_settings`, `walls`, `projects`, `wall_projects`, `inspections`, and `wall_photos`. The code uses profile IDs for authenticated users, client IDs on projects, the `wall_projects` join for project-to-wall assignments, and inspection rows associated with walls and inspector profiles. Inspection photo metadata uses `wall_photos`; uploaded objects use the `wall-photos` Storage bucket. Inspection object paths are organized under the wall and inspection IDs.

These relationships are inferred from application queries and writes. The repository does not include schema migrations, generated database types, or policy definitions, so the exact live schema, foreign keys, triggers, and constraints must be checked in the Supabase project.

All Supabase browser and session-backed server clients use the publishable key. The service/secret-key client is server-only and used for Auth Admin employee invitation/deletion and administrator-authorized permanent record cleanup. Destructive APIs verify the authenticated administrator role before using it. Do not copy secret keys into client components, public environment variables, or API responses.

## Roles and authorization

- **Administrators** can manage employee records, projects and project-wall assignments, wall edits, company/account settings, and security settings. Administrator-only APIs verify the authenticated user's profile role on the server. They can permanently delete projects, walls, inspections, and other employees; deleting a wall also deletes its assignments, inspections, photo metadata, and stored photos. Deleting an employee retains inspection records but removes their account and anonymizes attribution. The signed-in administrator cannot delete their own account, and the last administrator cannot be deleted.
- **Employees** can view workspace data and record inspections. Wall creation and the listed dashboard work areas are available to authenticated employees in the application.
- **Unauthenticated visitors** can access the sign-in page only. The root route leads to the authenticated dashboard.

These application checks do not replace Supabase Row Level Security. The live RLS and Storage policies have not been inspected or changed as part of this repository work. Confirm policies for every table and for `wall-photos` before deployment. Permanent cleanup spans Postgres and Storage and is not one atomic transaction; if a step fails, the API reports what remains and an administrator can retry. Validate the live foreign keys, nullable attribution columns, and Storage layout before relying on permanent deletion in production.

## Notifications and email

The notification control shows recent inspection records from the existing schema; it does not track read/unread state. User preferences for email notifications are saved, but WallTrack has no configured outbound notification-email provider. Employee invitations rely on Supabase Auth email configuration.

## Deployment

Deploy as a Node.js Next.js application and configure the three environment variables above in the hosting provider's secret/environment settings. Keep `SUPABASE_SECRET_KEY` server-only. Configure Supabase Auth redirect URLs, employee invitation email delivery, database RLS policies, and Storage policies for the deployed origins. Provide the private `wall-photos` bucket policies needed to upload images and issue signed viewing URLs.

This project is a prototype, not a production-ready service. Before using it with real users or data, verify live Supabase schema/policies and exercise sign-in, invitations, project/wall assignments, inspection uploads and rollback behavior, signed photo viewing, and employee/admin permissions in a non-production environment. No live Supabase or browser end-to-end testing is represented by the repository's automated checks.

## Outstanding reliability work

Cross-request duplicate inspection prevention and race-safe uniqueness for project-wall assignments require database-level idempotency/unique constraints. They are not fully guaranteed by client submission locks or pre-insert duplicate checks. Propose and approve migrations before implementing those guarantees. Also verify the employee invitation/profile trigger behavior in the live project before relying on its automatic profile-creation cleanup path.
