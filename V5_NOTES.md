# V5 Notes

This package updates Next.js to the latest tag and adds:
- auto-select first project on dashboard
- client invoices screen with add/edit/delete using browser local storage
- stronger dashboard cash-flow snapshot

Important: client invoices in this build are stored in the browser for the selected project.
If you want them persisted in Supabase, create a `client_invoices` table and wire a query hook in a follow-up build.
