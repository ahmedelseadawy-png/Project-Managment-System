# DB Fix v29

This version adds the missing Supabase SQL bootstrap files that were absent from the deploy ZIP.

## Main fix
- Added `supabase/project_controls_schema.sql`
- This creates the missing `public.qs_entries` table
- It also creates the related tables/views the dashboard expects, including:
  - `qs_approvals`
  - `certificates`
  - `certificate_lines`
  - `v_pending_approvals`
  - `v_dashboard_kpis`
  - `v_certificate_summary`
  - `v_commercial_summary`
  - `v_technical_overdue`

## Important
This is a **database** issue, not a Netlify build issue.
Uploading a new frontend ZIP alone will not create the missing Supabase table.
You must run the SQL file in your Supabase SQL Editor.
