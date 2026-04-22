# V7 notes

This package adds a first pass of project structure support and a clearer workflow foundation.

## Included in V7
- Project Structure module in the dashboard UI
- Phase / Building / Villa hierarchy stored per project in browser local storage
- Sidebar structure selector for dashboard focus
- Dashboard structure summary cards
- SQL migration draft for a `project_structures` table
- SQL helper to temporarily disable RLS on core workflow tables during development

## Important
- The new structure UI in this package is front-end first. It does not yet write to Supabase directly.
- The included SQL file shows the target database design for production implementation.
- If Add buttons still fail on Supabase-backed tables, apply the dev RLS SQL or create open CRUD policies while testing.
