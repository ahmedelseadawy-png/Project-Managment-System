QS flow updated in v30:
- QS input now links directly to the assigned BOQ breakdown row
- subcontractor was removed from the QS form
- assignment key and BOQ quantity are auto-filled from the selected breakdown row
- QS upsert now uses onConflict: project_id, breakdown_id, cert_no
- schema SQL was updated so qs_entries no longer requires subcontractor_id

Run the updated supabase/project_controls_schema.sql in Supabase before testing the QS screen.
