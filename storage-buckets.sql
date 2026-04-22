insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

create policy if not exists "attachments_public_read"
on storage.objects for select to public
using (bucket_id = 'attachments');

create policy if not exists "attachments_public_insert"
on storage.objects for insert to public
with check (bucket_id = 'attachments');

create policy if not exists "attachments_public_update"
on storage.objects for update to public
using (bucket_id = 'attachments')
with check (bucket_id = 'attachments');

create policy if not exists "attachments_public_delete"
on storage.objects for delete to public
using (bucket_id = 'attachments');
