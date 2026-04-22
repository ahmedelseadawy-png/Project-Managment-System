create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text not null unique,
  project_name text not null,
  client text,
  location text,
  contract_value numeric(18,2),
  start_date date,
  end_date date,
  status text not null default 'Planning' check (status in ('Planning','Active','On Hold','Completed','Cancelled')),
  report_month date,
  default_retention_pct numeric(5,2) not null default 0,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key,
  email text not null unique,
  full_name text not null,
  role text not null default 'Viewer' check (role in ('Admin','Project Manager','QS Engineer','Technical Engineer','Site Engineer','Procurement Officer','Finance','Viewer')),
  is_active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_users (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'Viewer' check (role in ('Admin','Project Manager','QS Engineer','Technical Engineer','Site Engineer','Procurement Officer','Finance','Viewer')),
  assigned_at timestamptz not null default now(),
  unique(project_id, user_id)
);

create table if not exists public.project_structures (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  parent_id uuid null references public.project_structures(id) on delete cascade,
  structure_code text not null,
  structure_name text not null,
  structure_type text not null check (structure_type in ('Phase','Building','Villa')),
  level_no integer not null default 1,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, structure_code)
);

create table if not exists public.subcontractors (
  id uuid primary key default gen_random_uuid(),
  subcontractor_code text not null unique,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  tax_registration_no text,
  commercial_reg_no text,
  default_retention_pct numeric(5,2) not null default 0,
  advance_amount numeric(18,2),
  advance_recovery_pct numeric(5,2),
  status text not null default 'Active' check (status in ('Active','Inactive','Blacklisted')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boq_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  structure_id uuid null references public.project_structures(id) on delete set null,
  item_code text not null,
  description text not null,
  unit text not null,
  boq_qty numeric(18,3) not null default 0,
  client_rate numeric(18,2),
  client_budget numeric(18,2),
  chapter text,
  discipline text check (discipline in ('Structural','Architectural','MEP','Civil','Landscaping','Fit-Out','Facade','Infrastructure','Other')),
  csi_ref text,
  wbs_code text,
  source_note text,
  is_provisional boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, item_code)
);

create table if not exists public.subcontract_breakdown (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  subcontractor_id uuid not null references public.subcontractors(id) on delete cascade,
  boq_item_id uuid not null references public.boq_items(id) on delete cascade,
  structure_id uuid null references public.project_structures(id) on delete set null,
  assignment_key text not null,
  project_model text,
  subcontract_qty numeric(18,3) not null default 0,
  rate numeric(18,2) not null default 0,
  contract_value numeric(18,2) generated always as (round((subcontract_qty * rate)::numeric, 2)) stored,
  client_rate numeric(18,2),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_subcontract_breakdown_project on public.subcontract_breakdown(project_id);
create index if not exists idx_subcontract_breakdown_subcontractor on public.subcontract_breakdown(subcontractor_id);

create table if not exists public.qs_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  breakdown_id uuid not null references public.subcontract_breakdown(id) on delete cascade,
  assignment_key text not null,
  cert_no integer not null,
  period_end date not null,
  boq_qty numeric(18,3) not null default 0,
  actual_survey_qty numeric(18,3),
  effective_pay_qty numeric(18,3) generated always as (coalesce(actual_survey_qty, boq_qty)) stored,
  notes text,
  submitted_by uuid,
  submitted_at timestamptz,
  status text not null default 'Draft' check (status in ('Draft','Submitted','Approved','Rejected','Cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, breakdown_id, cert_no)
);
create index if not exists idx_qs_entries_project on public.qs_entries(project_id);
create index if not exists idx_qs_entries_breakdown on public.qs_entries(breakdown_id);
create index if not exists idx_qs_entries_cert on public.qs_entries(project_id, cert_no);

create table if not exists public.qs_approvals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  qs_entry_id uuid not null references public.qs_entries(id) on delete cascade,
  status text not null check (status in ('Draft','Submitted','Approved','Rejected','Cancelled')),
  reviewed_by uuid,
  review_date timestamptz,
  approved_qty numeric(18,3),
  comments text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  subcontractor_id uuid not null references public.subcontractors(id) on delete cascade,
  structure_id uuid null references public.project_structures(id) on delete set null,
  cert_no integer not null,
  period_end date not null,
  gross_amount numeric(18,2) not null default 0,
  retention_pct numeric(5,2) not null default 0,
  retention_amount numeric(18,2) not null default 0,
  advance_recovery numeric(18,2) not null default 0,
  deductions numeric(18,2) not null default 0,
  penalties numeric(18,2) not null default 0,
  other_additions numeric(18,2) not null default 0,
  previously_paid numeric(18,2) not null default 0,
  net_payable numeric(18,2) not null default 0,
  status text not null default 'Draft' check (status in ('Draft','Submitted','Approved','Paid','Cancelled')),
  generated_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  payment_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, subcontractor_id, cert_no)
);

create table if not exists public.certificate_lines (
  id uuid primary key default gen_random_uuid(),
  certificate_id uuid not null references public.certificates(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  breakdown_id uuid not null references public.subcontract_breakdown(id) on delete cascade,
  qs_entry_id uuid null references public.qs_entries(id) on delete set null,
  line_no integer not null,
  assignment_key text not null,
  contract_qty numeric(18,3) not null default 0,
  actual_survey_qty numeric(18,3),
  effective_pay_qty numeric(18,3) not null default 0,
  previous_qty numeric(18,3) not null default 0,
  current_qty numeric(18,3) not null default 0,
  cumulative_qty numeric(18,3) generated always as (coalesce(previous_qty,0) + coalesce(current_qty,0)) stored,
  remaining_qty numeric(18,3) generated always as (greatest(coalesce(contract_qty,0) - (coalesce(previous_qty,0) + coalesce(current_qty,0)), 0)) stored,
  rate numeric(18,2) not null default 0,
  previous_value numeric(18,2) generated always as (round((coalesce(previous_qty,0) * rate)::numeric, 2)) stored,
  current_value numeric(18,2) generated always as (round((coalesce(current_qty,0) * rate)::numeric, 2)) stored,
  cumulative_value numeric(18,2) generated always as (round(((coalesce(previous_qty,0) + coalesce(current_qty,0)) * rate)::numeric, 2)) stored,
  warning text,
  created_at timestamptz not null default now()
);

create table if not exists public.technical_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  subcontractor_id uuid null references public.subcontractors(id) on delete set null,
  record_type text not null check (record_type in ('RFI','MIR','Material Submittal','Shop Drawing','Method Statement','Technical Query','NCR','Inspection Request')),
  reference_no text not null,
  subject text not null,
  discipline text check (discipline in ('Structural','Architectural','MEP','Civil','Landscaping','Fit-Out','Facade','Infrastructure','Other')),
  revision_no text,
  submission_date date,
  due_date date,
  response_date date,
  status text not null default 'Draft' check (status in ('Draft','Submitted','Under Review','Approved','Approved with Comments','Rejected','Closed','Overdue')),
  priority text not null default 'Medium' check (priority in ('Low','Medium','High','Critical')),
  responsible_person text,
  comments text,
  attachment_url text,
  rejection_reason text,
  boq_item_id uuid null references public.boq_items(id) on delete set null,
  structure_id uuid null references public.project_structures(id) on delete set null,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.procurement_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  pr_no text not null,
  material text not null,
  boq_item_id uuid null references public.boq_items(id) on delete set null,
  structure_id uuid null references public.project_structures(id) on delete set null,
  project_model text,
  required_qty numeric(18,3),
  unit text,
  supplier text,
  pr_date date,
  rfq_date date,
  po_date date,
  po_number text,
  po_value numeric(18,2),
  planned_delivery date,
  actual_delivery date,
  notes text,
  status text not null default 'PR Raised' check (status in ('PR Raised','RFQ Issued','PO Issued','Partially Delivered','Delivered','Cancelled','Delayed')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.variations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  subcontractor_id uuid null references public.subcontractors(id) on delete set null,
  boq_item_id uuid null references public.boq_items(id) on delete set null,
  vo_no text not null,
  description text not null,
  structure_id uuid null references public.project_structures(id) on delete set null,
  type text not null check (type in ('Addition','Omission','Substitution','Acceleration','Provisional Sum')),
  qty_impact numeric(18,3),
  unit text,
  rate numeric(18,2),
  financial_impact numeric(18,2) generated always as (case when qty_impact is null or rate is null then null else round((qty_impact * rate)::numeric, 2) end) stored,
  time_impact_days integer,
  status text not null default 'Draft' check (status in ('Draft','Submitted','Under Review','Approved','Rejected','Partially Approved')),
  approved_value numeric(18,2),
  submitted_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  remarks text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, vo_no)
);

create or replace view public.v_commercial_summary as
select
  sb.project_id,
  sb.subcontractor_id,
  s.subcontractor_code,
  s.name as subcontractor_name,
  coalesce(sum(sb.contract_value), 0)::numeric(18,2) as total_contract_value,
  coalesce(sum(case when c.status in ('Draft','Submitted','Approved','Paid') then c.gross_amount else 0 end), 0)::numeric(18,2) as total_certified_gross,
  coalesce(sum(case when c.status = 'Paid' then c.net_payable else 0 end), 0)::numeric(18,2) as total_net_paid,
  (coalesce(sum(sb.contract_value), 0) - coalesce(sum(case when c.status in ('Draft','Submitted','Approved','Paid') then c.gross_amount else 0 end), 0))::numeric(18,2) as remaining_value,
  case when coalesce(sum(sb.contract_value), 0) = 0 then 0 else round((coalesce(sum(case when c.status in ('Draft','Submitted','Approved','Paid') then c.gross_amount else 0 end), 0) / nullif(sum(sb.contract_value),0)) * 100, 2) end::numeric(18,2) as achievement_pct
from public.subcontract_breakdown sb
join public.subcontractors s on s.id = sb.subcontractor_id
left join public.certificates c on c.project_id = sb.project_id and c.subcontractor_id = sb.subcontractor_id
group by sb.project_id, sb.subcontractor_id, s.subcontractor_code, s.name;

create or replace view public.v_certificate_summary as
select
  c.project_id,
  c.subcontractor_id,
  s.subcontractor_code,
  s.name as subcontractor_name,
  count(*)::int as total_certificates,
  coalesce(sum(c.gross_amount),0)::numeric(18,2) as total_gross,
  coalesce(sum(c.retention_amount),0)::numeric(18,2) as total_retention,
  coalesce(sum(case when c.status = 'Paid' then c.net_payable else 0 end),0)::numeric(18,2) as total_net_paid,
  coalesce(max(c.cert_no),0)::int as latest_cert_no,
  max(c.period_end)::date as latest_period
from public.certificates c
join public.subcontractors s on s.id = c.subcontractor_id
group by c.project_id, c.subcontractor_id, s.subcontractor_code, s.name;

create or replace view public.v_pending_approvals as
select
  q.id,
  q.project_id,
  p.project_name,
  sb.subcontractor_id,
  s.name as subcontractor_name,
  q.assignment_key,
  q.cert_no,
  q.period_end,
  q.boq_qty,
  q.actual_survey_qty,
  q.effective_pay_qty,
  q.status,
  q.submitted_at
from public.qs_entries q
join public.projects p on p.id = q.project_id
join public.subcontract_breakdown sb on sb.id = q.breakdown_id
join public.subcontractors s on s.id = sb.subcontractor_id
where q.status = 'Submitted';

create or replace view public.v_technical_overdue as
select
  tr.*,
  greatest((current_date - tr.due_date), 0)::int as days_overdue,
  p.project_name,
  s.name as subcontractor_name
from public.technical_records tr
join public.projects p on p.id = tr.project_id
left join public.subcontractors s on s.id = tr.subcontractor_id
where tr.due_date is not null
  and tr.due_date < current_date
  and tr.status not in ('Approved','Approved with Comments','Closed');

create or replace view public.v_dashboard_kpis as
with contract_sum as (
  select project_id, coalesce(sum(contract_value),0)::numeric(18,2) as total_subcontract_value
  from public.subcontract_breakdown
  group by project_id
), cert_sum as (
  select project_id, coalesce(sum(gross_amount),0)::numeric(18,2) as total_certified_value
  from public.certificates
  where status in ('Draft','Submitted','Approved','Paid')
  group by project_id
), tech_sum as (
  select project_id,
    count(*) filter (where status not in ('Approved','Approved with Comments','Closed'))::int as technical_open,
    count(*) filter (where due_date is not null and due_date < current_date and status not in ('Approved','Approved with Comments','Closed'))::int as technical_overdue
  from public.technical_records
  group by project_id
), proc_sum as (
  select project_id,
    count(*) filter (where status = 'Delayed')::int as procurement_delayed
  from public.procurement_records
  group by project_id
), pending_sum as (
  select project_id,
    count(*) filter (where status = 'Submitted')::int as pending_approvals
  from public.qs_entries
  group by project_id
)
select
  p.id as project_id,
  p.project_name,
  p.status as project_status,
  coalesce(cs.total_subcontract_value,0)::numeric(18,2) as total_subcontract_value,
  coalesce(ct.total_certified_value,0)::numeric(18,2) as total_certified_value,
  (coalesce(cs.total_subcontract_value,0) - coalesce(ct.total_certified_value,0))::numeric(18,2) as remaining_value,
  coalesce(ts.technical_open,0)::int as technical_open,
  coalesce(ts.technical_overdue,0)::int as technical_overdue,
  coalesce(ps.procurement_delayed,0)::int as procurement_delayed,
  coalesce(pas.pending_approvals,0)::int as pending_approvals
from public.projects p
left join contract_sum cs on cs.project_id = p.id
left join cert_sum ct on ct.project_id = p.id
left join tech_sum ts on ts.project_id = p.id
left join proc_sum ps on ps.project_id = p.id
left join pending_sum pas on pas.project_id = p.id;

-- Dev-friendly RLS defaults for immediate app use.
alter table public.projects enable row level security;
alter table public.users enable row level security;
alter table public.project_users enable row level security;
alter table public.project_structures enable row level security;
alter table public.subcontractors enable row level security;
alter table public.boq_items enable row level security;
alter table public.subcontract_breakdown enable row level security;
alter table public.qs_entries enable row level security;
alter table public.qs_approvals enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_lines enable row level security;
alter table public.technical_records enable row level security;
alter table public.procurement_records enable row level security;
alter table public.variations enable row level security;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['projects','users','project_users','project_structures','subcontractors','boq_items','subcontract_breakdown','qs_entries','qs_approvals','certificates','certificate_lines','technical_records','procurement_records','variations']
  LOOP
    EXECUTE format('drop policy if exists "%1$s_select_all_dev" on public.%1$s', t);
    EXECUTE format('create policy "%1$s_select_all_dev" on public.%1$s for select to public using (true)', t, t);
    EXECUTE format('drop policy if exists "%1$s_insert_all_dev" on public.%1$s', t);
    EXECUTE format('create policy "%1$s_insert_all_dev" on public.%1$s for insert to public with check (true)', t, t);
    EXECUTE format('drop policy if exists "%1$s_update_all_dev" on public.%1$s', t);
    EXECUTE format('create policy "%1$s_update_all_dev" on public.%1$s for update to public using (true) with check (true)', t, t);
    EXECUTE format('drop policy if exists "%1$s_delete_all_dev" on public.%1$s', t);
    EXECUTE format('create policy "%1$s_delete_all_dev" on public.%1$s for delete to public using (true)', t, t);
  END LOOP;
END $$;
