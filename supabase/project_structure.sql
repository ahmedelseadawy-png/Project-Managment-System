create table if not exists public.project_structures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null,
  name text not null,
  type text not null check (type in ('Phase','Building','Villa')),
  parent_id uuid null references public.project_structures(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, code)
);

alter table public.project_structures enable row level security;

create policy if not exists "project_structures_select_all_dev"
on public.project_structures for select to public using (true);
create policy if not exists "project_structures_insert_all_dev"
on public.project_structures for insert to public with check (true);
create policy if not exists "project_structures_update_all_dev"
on public.project_structures for update to public using (true) with check (true);
create policy if not exists "project_structures_delete_all_dev"
on public.project_structures for delete to public using (true);

alter table public.boq_items add column if not exists structure_id uuid null references public.project_structures(id);
alter table public.subcontract_breakdown add column if not exists structure_id uuid null references public.project_structures(id);
alter table public.qs_entries add column if not exists structure_id uuid null references public.project_structures(id);
alter table public.certificates add column if not exists structure_id uuid null references public.project_structures(id);
alter table public.technical_records add column if not exists structure_id uuid null references public.project_structures(id);
alter table public.procurement_records add column if not exists structure_id uuid null references public.project_structures(id);
alter table public.variations add column if not exists structure_id uuid null references public.project_structures(id);
