# WallTrack

WallTrack is a portfolio prototype for managing advertising wall locations and the field work around them. It brings a searchable wall register, map, projects, inspections, inspection photos, and employee accounts into one workspace.

> **Prototype notice:** WallTrack is not production-ready. Use a separate Supabase project with synthetic data for public demonstrations. Do not enter real employee, client, or operational information.

## Live demo

- **App:** [WallTrack on Vercel](https://themediakrate-walltrack.vercel.app/login)
- **Source:** [KMukendi10/themediakrate-walltrack on GitHub](https://github.com/KMukendi10/themediakrate-walltrack)

The sign-in page is public, but the workspace requires an authorized account. No demo credentials are published. A recruiter will need a demo account to explore the protected workflows.

## What it does

- **Wall inventory and map:** Register and update advertising walls, track their location and status, and view wall markers on an interactive map.
- **Projects:** Organize campaigns, associate clients, set project dates and status, and assign walls.
- **Inspections:** Record a wall's condition, inspection date, notes, and photos; review inspection history and identify walls needing attention.
- **Employee administration:** Invite employees, manage account details and roles, and restrict administrative actions.
- **Workspace settings:** Manage account, company, security, and display preferences.

### Example workflows

1. Register a wall with its address and coordinates, then find it in the wall directory or on the map.
2. Create a project and associate the walls used for it.
3. Record an inspection from the field, add condition notes and photos, then review the record from the inspection history.
4. As an administrator, invite an employee and manage team access.

## Screenshots

The dashboard is protected by authentication, and screenshots of the current workspace may contain real operational information. Screenshots are intentionally not included until a demo-only Supabase workspace with synthetic data is available. Add sanitized screenshots from that workspace here before using this repository as a public portfolio demo.

## Tech stack

- Next.js App Router, React, and TypeScript
- Supabase Auth, Postgres, and Storage
- `@supabase/ssr` for browser and server session clients
- Leaflet with OpenStreetMap tiles
- Tailwind CSS

## Architecture notes

- Authenticated pages use server-side Supabase clients; interactive forms and the map use client components where needed.
- Route handlers validate incoming project, inspection, and employee operations and enforce application-level roles.
- The Supabase admin client is server-only and requires `SUPABASE_SECRET_KEY` only when an admin operation creates it.
- The repository does not include database migrations or the deployed Row Level Security and Storage policies. Those must be verified in Supabase; application role checks do not replace RLS.
- Deletions that span Postgres and Storage are not a single atomic transaction. The application reports incomplete cleanup for an administrator to investigate.

## Run locally

### Requirements

- Node.js 22.6 or newer
- npm
- A Supabase project configured with this application's schema, Auth, and Storage

### Setup

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env.local` (in PowerShell: `Copy-Item .env.example .env.local`) and fill in the values:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SECRET_KEY=
   ```

   Get the URL and publishable key from your Supabase project's API settings. The secret key is only for server-side Auth Admin and cleanup operations. Never add a `NEXT_PUBLIC_` prefix to it, and never commit `.env.local`.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) and sign in with an account in your Supabase project.

## Useful commands

```bash
npm run dev
npm test
npm run lint
npm run build
npm start
```

The unit tests cover date formatting and project and inspection input validation. They do not connect to Supabase or exercise browser workflows.

## Application routes

| Route | Purpose |
|---|---|
| `/login` | Employee sign-in. |
| `/dashboard` | Workspace summary and recent inspections. |
| `/dashboard/walls` | Wall directory; `/new`, `/[id]`, and `/[id]/edit` register, view, and update walls. Administrators can permanently delete a wall and its related records and photos. |
| `/dashboard/map` | Map of registered wall locations. |
| `/dashboard/projects` | Project directory; `/new`, `/[id]`, and `/[id]/edit` manage projects and wall assignments. |
| `/dashboard/inspections` | Inspection history; `/new` and `/[id]` record and review inspections and photos. Administrators can permanently delete inspections. |
| `/dashboard/employees` | Administrator-only employee directory, invitation, editing, and account management. |
| `/dashboard/settings` | Account, company, role, security, and preference pages. |

## Supabase setup and public-demo safety

The application uses `profiles`, `user_preferences`, `clients`, `company_settings`, `walls`, `projects`, `wall_projects`, `inspections`, and `wall_photos` tables, plus the private `wall-photos` Storage bucket. This schema is inferred from application queries; migrations and generated database types are not included.

Before deploying a public demo:

1. Use a separate Supabase project populated only with synthetic walls, clients, employees, projects, and inspection photos.
2. Verify Row Level Security on every table and access policies on the Storage bucket. Do not rely on the UI or application role checks as the only protection.
3. Configure Supabase Auth redirect URLs and invitation email settings for the deployment domain.
4. Add the three variables above to the hosting provider. Keep `SUPABASE_SECRET_KEY` server-only.
5. Test sign-in, employee permissions, photo uploads and signed URLs, and destructive operations using non-production data.
6. Only share demo credentials if the demo account is isolated, read-only where practical, and routinely reset.

Never commit `.env.local`, Supabase secrets, database exports, or real user and company data. The repository ignores `.env*`; `.env.example` is the blank template safe to share.

## Known limitations

- No schema migrations, generated database types, or automated Supabase policy setup are included.
- Automated checks do not include live database or end-to-end browser tests.
- Cross-request duplicate inspection prevention and race-safe uniqueness for project-wall assignments require database-level constraints.
- Verify employee invitation and profile-trigger behavior in the target Supabase project before relying on its cleanup path.
