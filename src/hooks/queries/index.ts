'use client'
// src/hooks/queries/index.ts
// All data hooks for the Project Controls System

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { unwrap, unwrapOptional } from '@/lib/supabase/helpers'
import { qk } from '@/lib/query-keys'
import type {
  Project, ProjectInsert,
  Subcontractor, SubcontractorInsert,
  BoqItem, BoqItemInsert,
  SubcontractBreakdown, SubcontractBreakdownInsert,
  QsEntry, QsEntryInsert, StructureNode, StructureNodeInsert, StructureNodeUpdate, NodeType, TenderItem, TenderItemInsert, CostCategory, ScheduleActivity, ScheduleActivityInsert, ActivityStatus, QtoLine, QtoLineInsert, QtoLineUpdate, VillaUnit, VillaUnitInsert, VillaProgress, VillaProgressInsert, VillaProgressUpdate, TradeType,
  Certificate, CertificateInsert,
  CertificateLine, CertificateLineInsert,
  TechnicalRecord, TechnicalRecordInsert,
  TechnicalStatus,
  ProcurementRecord, ProcurementRecordInsert, ProcurementStatus,
  Variation, VariationInsert, VariationStatus,
  VDashboardKpis, VCommercialSummary, VCertificateSummary, VTechnicalOverdue, VPendingApproval,
  ApprovalStatus, CertificateStatus,
} from '@/types/database'
import type { GenerateCertificateRequest, GenerateCertificateResponse } from '@/types/certificate-engine'

// ─── helpers ────────────────────────────────────────────────────────────────

export function calcEffectivePayQty(survey: number | null | undefined, boq: number): number {
  return !survey || survey === 0 ? boq : survey
}

// ─── PROJECTS ───────────────────────────────────────────────────────────────

export function useProjects() {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.projects.list(),
    queryFn: async (): Promise<Project[]> => unwrap(await supabase.from('projects').select('*').order('project_name'), []),
  })
}

export function useProject(id: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.projects.detail(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<Project | null> => unwrapOptional(await supabase.from('projects').select('*').eq('id', id!).single()),
  })
}

export function useDashboardKpis(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.dashboard.kpis(projectId ?? ''),
    enabled: !!projectId,
    queryFn: async (): Promise<VDashboardKpis | null> => unwrapOptional(await supabase.from('v_dashboard_kpis').select('*').eq('project_id', projectId!).single()),
  })
}

export function useCreateProject() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProjectInsert): Promise<Project> => unwrap(await supabase.from('projects').insert(input as any).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects.list() }),
  })
}

export function useUpdateProject() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProjectInsert> }): Promise<Project> =>
      unwrap(await supabase.from('projects').update(data as any).eq('id', id).select().single()),
    onSuccess: (p) => { qc.invalidateQueries({ queryKey: qk.projects.list() }); qc.setQueryData(qk.projects.detail(p.id), p) },
  })
}

// ─── SUBCONTRACTORS ──────────────────────────────────────────────────────────

export function useSubcontractors() {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.subcontractors.list(),
    queryFn: async (): Promise<Subcontractor[]> => unwrap(await supabase.from('subcontractors').select('*').order('subcontractor_code'), []),
  })
}

export function useSubcontractor(id: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.subcontractors.detail(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<Subcontractor | null> => unwrapOptional(await supabase.from('subcontractors').select('*').eq('id', id!).single()),
  })
}

export function useCommercialSummary(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.commercial.summary(projectId ?? ''),
    enabled: !!projectId,
    queryFn: async (): Promise<VCommercialSummary[]> => unwrap(await supabase.from('v_commercial_summary').select('*').eq('project_id', projectId!).order('subcontractor_code'), []),
  })
}

export function useCreateSubcontractor() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SubcontractorInsert): Promise<Subcontractor> => unwrap(await supabase.from('subcontractors').insert(input as any).select().single()),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.subcontractors.all() }),
  })
}

export function useUpdateSubcontractor() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubcontractorInsert> }): Promise<Subcontractor> =>
      unwrap(await supabase.from('subcontractors').update(data as any).eq('id', id).select().single()),
    onSuccess: (s) => { qc.invalidateQueries({ queryKey: qk.subcontractors.all() }); qc.setQueryData(qk.subcontractors.detail(s.id), s) },
  })
}

// ─── BOQ ────────────────────────────────────────────────────────────────────

export function useBoqItems(projectId: string | null, filters?: { discipline?: string; search?: string }) {
  const supabase = createClient()
  return useQuery({
    queryKey: [...qk.boq.list(projectId ?? ''), filters],
    enabled: !!projectId,
    queryFn: async (): Promise<BoqItem[]> => {
      let q = supabase.from('boq_items').select('*').eq('project_id', projectId!).order('item_code')
      if (filters?.discipline) q = q.eq('discipline', filters.discipline as BoqItem['discipline'])
      if (filters?.search) q = q.or(`item_code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      return unwrap(await q, [])
    },
  })
}

export function useCreateBoqItem() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: BoqItemInsert): Promise<BoqItem> => unwrap(await supabase.from('boq_items').insert(input as any).select().single()),
    onSuccess: (item) => qc.invalidateQueries({ queryKey: qk.boq.list(item.project_id) }),
  })
}

export function useBulkImportBoq() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, items }: { projectId: string; items: Omit<BoqItemInsert, 'project_id'>[] }) => {
      const rows: BoqItemInsert[] = items.map(i => ({ ...i, project_id: projectId }))
      const BATCH = 500
      let inserted = 0
      for (let i = 0; i < rows.length; i += BATCH) {
        // Split into rows with structure_id (use upsert) and without (use insert ignore)
        const withStructure = rows.slice(i, i + BATCH).filter((r: any) => r.structure_id)
        const withoutStructure = rows.slice(i, i + BATCH).filter((r: any) => !r.structure_id)
        let count = 0
        if (withStructure.length) {
          const res = await supabase.from('boq_items').upsert(withStructure as any, { onConflict: 'project_id,structure_id,item_code' }).select('id')
          count += unwrap(res, []).length
        }
        if (withoutStructure.length) {
          const res = await supabase.from('boq_items').insert(withoutStructure as any).select('id')
          count += unwrap(res, []).length
        }
        inserted += count
        continue
      }
      return { inserted, projectId }
    },
    onSuccess: ({ projectId }) => qc.invalidateQueries({ queryKey: qk.boq.list(projectId) }),
  })
}

export function useUpdateBoqItem() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<BoqItemInsert> }): Promise<BoqItem> =>
      unwrap(await supabase.from('boq_items').update(data as any).eq('id', id).select().single()),
    onSuccess: (item) => { qc.invalidateQueries({ queryKey: qk.boq.list(item.project_id) }); qc.setQueryData(qk.boq.detail(item.id), item) },
  })
}

// ─── SUBCONTRACT BREAKDOWN ──────────────────────────────────────────────────

export interface BreakdownWithJoins extends SubcontractBreakdown {
  subcontractors: { subcontractor_code: string; name: string }
  boq_items: { item_code: string; description: string; unit: string }
}

export function useSubcontractBreakdown(projectId: string | null, subcontractorId?: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: subcontractorId ? qk.breakdown.bySub(projectId ?? '', subcontractorId) : qk.breakdown.list(projectId ?? ''),
    enabled: !!projectId,
    queryFn: async (): Promise<BreakdownWithJoins[]> => {
      let q = supabase.from('subcontract_breakdown').select('*, subcontractors(subcontractor_code,name), boq_items(item_code,description,unit)')
        .eq('project_id', projectId!).eq('is_active', true).order('assignment_key')
      if (subcontractorId) q = q.eq('subcontractor_id', subcontractorId)
      return unwrap(await q, []) as BreakdownWithJoins[]
    },
  })
}

export function useCreateBreakdown() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: SubcontractBreakdownInsert): Promise<SubcontractBreakdown> =>
      unwrap(await supabase.from('subcontract_breakdown').insert(input as any).select().single()),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: qk.breakdown.list(r.project_id) }); qc.invalidateQueries({ queryKey: qk.commercial.summary(r.project_id) }) },
  })
}

export function useUpdateBreakdown() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SubcontractBreakdownInsert> }): Promise<SubcontractBreakdown> =>
      unwrap(await supabase.from('subcontract_breakdown').update(data as any).eq('id', id).select().single()),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: qk.breakdown.list(r.project_id) }); qc.invalidateQueries({ queryKey: qk.commercial.summary(r.project_id) }) },
  })
}

// ─── QS ENTRIES ──────────────────────────────────────────────────────────────

export function useQsEntries(projectId: string | null, subcontractorId?: string, certNo?: number) {
  const supabase = createClient()
  const key = certNo ? qk.qs.byCert(projectId ?? '', certNo) : subcontractorId ? qk.qs.bySub(projectId ?? '', subcontractorId) : qk.qs.list(projectId ?? '')
  return useQuery({
    queryKey: key,
    enabled: !!projectId,
    queryFn: async (): Promise<QsEntry[]> => {
      let q = supabase.from('qs_entries').select('*').eq('project_id', projectId!).order('period_end', { ascending: false })
      if (certNo !== undefined) q = q.eq('cert_no', certNo)
      return unwrap(await q, [])
    },
  })
}

export function usePendingApprovals(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.qs.pending(projectId ?? ''),
    enabled: !!projectId,
    queryFn: async (): Promise<VPendingApproval[]> => unwrap(await supabase.from('v_pending_approvals').select('*').eq('project_id', projectId!).order('submitted_at'), []),
  })
}

export function useBatchCreateQsEntries() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, entries }: { projectId: string; entries: Omit<QsEntryInsert, 'project_id'>[] }): Promise<QsEntry[]> => {
      const rows: QsEntryInsert[] = entries.map(e => ({ ...e, project_id: projectId }))
      return unwrap(await supabase.from('qs_entries').upsert(rows as any, { onConflict: 'project_id,breakdown_id,cert_no' }).select(), [])
    },
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: qk.qs.list(vars.projectId) }); qc.invalidateQueries({ queryKey: qk.qs.pending(vars.projectId) }) },
  })
}

export function useSubmitQsEntry() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<QsEntry> =>
      unwrap(await supabase.from('qs_entries').update({ status: 'Submitted' as ApprovalStatus, submitted_at: new Date().toISOString() } as any).eq('id', id).select().single()),
    onSuccess: (e) => { qc.invalidateQueries({ queryKey: qk.qs.list(e.project_id) }); qc.invalidateQueries({ queryKey: qk.qs.pending(e.project_id) }) },
  })
}

export function useReviewQsEntry() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ qsEntryId, projectId, decision, approvedQty, comments }: { qsEntryId: string; projectId: string; decision: 'Approved' | 'Rejected'; approvedQty?: number; comments?: string }): Promise<QsEntry> => {
      const entry: QsEntry = unwrap<QsEntry>(await supabase.from('qs_entries').update({ status: decision as ApprovalStatus } as any).eq('id', qsEntryId).select().single() as any)
      unwrap(await supabase.from('qs_approvals').insert({ project_id: projectId, qs_entry_id: qsEntryId, status: decision as ApprovalStatus, review_date: new Date().toISOString(), approved_qty: approvedQty ?? null, comments: comments ?? null } as any).select().single() as any)
      return entry
    },
    onSuccess: (e: QsEntry) => { qc.invalidateQueries({ queryKey: qk.qs.list(e.project_id) }); qc.invalidateQueries({ queryKey: qk.qs.pending(e.project_id) }); qc.invalidateQueries({ queryKey: qk.approvals.list(e.project_id) }) },
  })
}

// ─── CERTIFICATES ────────────────────────────────────────────────────────────

export interface CertificateWithSub extends Certificate {
  subcontractors: { subcontractor_code: string; name: string }
}

export function useCertificates(projectId: string | null, subcontractorId?: string) {
  const supabase = createClient()
  const key = subcontractorId ? qk.certificates.bySub(projectId ?? '', subcontractorId) : qk.certificates.list(projectId ?? '')
  return useQuery({
    queryKey: key,
    enabled: !!projectId,
    queryFn: async (): Promise<CertificateWithSub[]> => {
      let q = supabase.from('subcontractor_invoices').select('*, subcontractors(subcontractor_code,name)').eq('project_id', projectId!).order('period_end', { ascending: false })
      if (subcontractorId) q = q.eq('subcontractor_id', subcontractorId)
      return unwrap(await q, []) as CertificateWithSub[]
    },
  })
}

export function useCertificateDetail(id: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.certificates.detail(id ?? ''),
    enabled: !!id,
    queryFn: async (): Promise<CertificateWithSub | null> =>
      unwrapOptional(await supabase.from('subcontractor_invoices').select('*, subcontractors(subcontractor_code,name)').eq('id', id!).single()) as CertificateWithSub | null,
  })
}

export function useCertificateLines(certificateId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.certificates.lines(certificateId ?? ''),
    enabled: !!certificateId,
    queryFn: async (): Promise<CertificateLine[]> => unwrap(await supabase.from('subcontractor_invoice_lines').select('*').eq('invoice_id', certificateId!).order('line_no'), []),
  })
}

export function useCertificateSummary(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.certificates.summary(projectId ?? ''),
    enabled: !!projectId,
    queryFn: async (): Promise<VCertificateSummary[]> => unwrap(await supabase.from('subcontractor_invoices').select('*, subcontractors(subcontractor_code,name)').eq('project_id', projectId!).order('created_at', { ascending: false }), []),
  })
}

export function useNextCertNo(projectId: string | null, subcontractorId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['nextCertNo', projectId, subcontractorId],
    enabled: !!projectId && !!subcontractorId,
    queryFn: async (): Promise<number> => {
      // Count invoices for this subcontractor — next = count + 1
      const { count } = await supabase.from('subcontractor_invoices')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId!)
        .eq('subcontractor_id', subcontractorId!)
      return (count ?? 0) + 1
    },
  })
}



export function useCreateCertificate() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CertificateInsert): Promise<Certificate> =>
      unwrap(await supabase.from('subcontractor_invoices').insert(input as any).select().single()),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: qk.certificates.list(c.project_id) })
      qc.invalidateQueries({ queryKey: qk.certificates.summary(c.project_id) })
      qc.invalidateQueries({ queryKey: qk.dashboard.kpis(c.project_id) })
    },
  })
}
export function useUpdateCertificate() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CertificateInsert> }): Promise<Certificate> =>
      unwrap(await supabase.from('subcontractor_invoices').update(data as any).eq('id', id).select().single()),
    onSuccess: (c) => { qc.setQueryData(qk.certificates.detail(c.id), c); qc.invalidateQueries({ queryKey: qk.certificates.list(c.project_id) }); qc.invalidateQueries({ queryKey: qk.dashboard.kpis(c.project_id) }) },
  })
}

export function useApproveCertificate() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, paymentDate }: { id: string; status: Extract<CertificateStatus, 'Approved' | 'Paid'>; paymentDate?: string }): Promise<Certificate> => {
      const update: Partial<CertificateInsert> = { status }
      return unwrap(await supabase.from('subcontractor_invoices').update(update as any).eq('id', id).select().single())
    },
    onSuccess: (c) => { qc.invalidateQueries({ queryKey: qk.certificates.list(c.project_id) }); qc.setQueryData(qk.certificates.detail(c.id), c) },
  })
}

// ─── CERTIFICATE ENGINE (Edge Function) ──────────────────────────────────────

async function callCertEngine(req: GenerateCertificateRequest): Promise<GenerateCertificateResponse> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')
  const res = await supabase.functions.invoke('generate-certificate', {
    body: req,
    headers: { Authorization: `Bearer ${session.access_token}` },
  }) as { data: GenerateCertificateResponse | null; error: Error | null }
  if (res.error) throw new Error(res.error.message)
  if (!res.data) throw new Error('Empty response from certificate engine')
  return res.data
}

export function usePreviewCertificate() {
  return useMutation({ mutationFn: (req: Omit<GenerateCertificateRequest, 'dry_run'>) => callCertEngine({ ...req, dry_run: true }) })
}

export function useGenerateCertificate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: Omit<GenerateCertificateRequest, 'dry_run'>) => callCertEngine({ ...req, dry_run: false }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: qk.certificates.list(data.project_id) })
      qc.invalidateQueries({ queryKey: qk.certificates.summary(data.project_id) })
      qc.invalidateQueries({ queryKey: qk.dashboard.kpis(data.project_id) })
      qc.invalidateQueries({ queryKey: qk.commercial.summary(data.project_id) })
    },
  })
}

// ─── TECHNICAL OFFICE ────────────────────────────────────────────────────────

export function useTechnicalRecords(projectId: string | null, filters?: { recordType?: string; status?: string; search?: string }) {
  const supabase = createClient()
  return useQuery({
    queryKey: [...qk.technical.list(projectId ?? ''), filters],
    enabled: !!projectId,
    queryFn: async (): Promise<TechnicalRecord[]> => {
      let q = supabase.from('technical_records').select('*').eq('project_id', projectId!).order('due_date', { ascending: true, nullsFirst: false })
      if (filters?.recordType) q = q.eq('record_type', filters.recordType as TechnicalRecord['record_type'])
      if (filters?.status) q = q.eq('status', filters.status as TechnicalStatus)
      if (filters?.search) q = q.or(`reference_no.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`)
      return unwrap(await q, [])
    },
  })
}

export function useOverdueTechnicalItems(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.technical.overdue(projectId ?? ''),
    enabled: !!projectId,
    refetchInterval: 5 * 60_000,
    queryFn: async (): Promise<VTechnicalOverdue[]> => unwrap(await supabase.from('v_technical_overdue').select('*').eq('project_id', projectId!).order('days_overdue', { ascending: false }), []),
  })
}

export function useTechnicalRealtimeSync(projectId: string | null) {
  const supabase = createClient()
  const qc = useQueryClient()
  useEffect(() => {
    if (!projectId) return
    const ch = supabase.channel(`technical-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'technical_records', filter: `project_id=eq.${projectId}` }, () => {
        qc.invalidateQueries({ queryKey: qk.technical.list(projectId) })
        qc.invalidateQueries({ queryKey: qk.technical.overdue(projectId) })
        qc.invalidateQueries({ queryKey: qk.dashboard.kpis(projectId) })
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [projectId]) // eslint-disable-line
}

export function useCreateTechnicalRecord() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TechnicalRecordInsert): Promise<TechnicalRecord> => unwrap(await supabase.from('technical_records').insert(input as any).select().single()),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: qk.technical.list(r.project_id) }); qc.invalidateQueries({ queryKey: qk.dashboard.kpis(r.project_id) }) },
  })
}

export function useUpdateTechnicalRecord() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<TechnicalRecordInsert> }): Promise<TechnicalRecord> =>
      unwrap(await supabase.from('technical_records').update(data as any).eq('id', id).select().single()),
    onSuccess: (r) => { qc.setQueryData(qk.technical.detail(r.id), r); qc.invalidateQueries({ queryKey: qk.technical.list(r.project_id) }); qc.invalidateQueries({ queryKey: qk.technical.overdue(r.project_id) }) },
  })
}

export function useSetTechnicalStatus() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, responseDate, comments }: { id: string; status: TechnicalStatus; responseDate?: string; comments?: string }): Promise<TechnicalRecord> => {
      const update: Partial<TechnicalRecordInsert> = { status }
      if (responseDate) update.response_date = responseDate
      if (comments) update.comments = comments
      return unwrap(await supabase.from('technical_records').update(update as any).eq('id', id).select().single())
    },
    onSuccess: (r) => { qc.setQueryData(qk.technical.detail(r.id), r); qc.invalidateQueries({ queryKey: qk.technical.list(r.project_id) }); qc.invalidateQueries({ queryKey: qk.technical.overdue(r.project_id) }); qc.invalidateQueries({ queryKey: qk.dashboard.kpis(r.project_id) }) },
  })
}

// ─── PROCUREMENT ─────────────────────────────────────────────────────────────

export function useProcurementRecords(projectId: string | null, status?: ProcurementStatus) {
  const supabase = createClient()
  return useQuery({
    queryKey: status ? qk.procurement.delayed(projectId ?? '') : qk.procurement.list(projectId ?? ''),
    enabled: !!projectId,
    queryFn: async (): Promise<ProcurementRecord[]> => {
      let q = supabase.from('procurement_records').select('*').eq('project_id', projectId!).order('pr_date', { ascending: false })
      if (status) q = q.eq('status', status)
      return unwrap(await q, [])
    },
  })
}

export function useCreateProcurement() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: ProcurementRecordInsert): Promise<ProcurementRecord> => unwrap(await supabase.from('procurement_records').insert(input as any).select().single()),
    onSuccess: (r) => { qc.invalidateQueries({ queryKey: qk.procurement.list(r.project_id) }); qc.invalidateQueries({ queryKey: qk.dashboard.kpis(r.project_id) }) },
  })
}

export function useUpdateProcurement() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ProcurementRecordInsert> }): Promise<ProcurementRecord> =>
      unwrap(await supabase.from('procurement_records').update(data as any).eq('id', id).select().single()),
    onSuccess: (r) => { qc.setQueryData(qk.procurement.detail(r.id), r); qc.invalidateQueries({ queryKey: qk.procurement.list(r.project_id) }) },
  })
}

// ─── VARIATIONS ──────────────────────────────────────────────────────────────

export function useVariations(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: qk.variations.list(projectId ?? ''),
    enabled: !!projectId,
    queryFn: async (): Promise<Variation[]> => unwrap(await supabase.from('variations').select('*').eq('project_id', projectId!).order('vo_no'), []),
  })
}

export function useCreateVariation() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: VariationInsert): Promise<Variation> => unwrap(await supabase.from('variations').insert(input as any).select().single()),
    onSuccess: (v) => qc.invalidateQueries({ queryKey: qk.variations.list(v.project_id) }),
  })
}

export function useApproveVariation() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, approvedValue }: { id: string; status: Extract<VariationStatus, 'Approved' | 'Rejected' | 'Partially Approved'>; approvedValue?: number }): Promise<Variation> =>
      unwrap(await supabase.from('variations').update({ status, approved_value: approvedValue ?? null, approved_at: new Date().toISOString() } as any).eq('id', id).select().single()),
    onSuccess: (v) => qc.invalidateQueries({ queryKey: qk.variations.list(v.project_id) }),
  })
}

export function useTenderItems(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['tender_items', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<TenderItem[]> => unwrap(await supabase.from('tender_items').select('*').eq('project_id', projectId!).order('created_at'), []),
  })
}

export function useCreateTenderItem() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: TenderItemInsert): Promise<TenderItem> => unwrap(await supabase.from('tender_items').insert(input as any).select().single()),
    onSuccess: (item) => qc.invalidateQueries({ queryKey: ['tender_items', item.project_id] }),
  })
}

export function useDeleteTenderItem() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => { const { error } = await supabase.from('tender_items').delete().eq('id', id); if (error) throw error },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tender_items'] }),
  })
}

// ── Schedule / Primavera ──────────────────────────────────────────
export function useScheduleActivities(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['schedule_activities', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ScheduleActivity[]> => unwrap(
      await supabase.from('schedule_activities').select('*').eq('project_id', projectId!).order('planned_start'),
      []
    ),
  })
}

export function useBulkUpsertSchedule() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, activities }: { projectId: string; activities: Omit<ScheduleActivityInsert, 'project_id'>[] }) => {
      const rows: ScheduleActivityInsert[] = activities.map(a => ({ ...a, project_id: projectId }))
      const BATCH = 500
      let upserted = 0
      for (let i = 0; i < rows.length; i += BATCH) {
        const res = await supabase.from('schedule_activities')
          .upsert(rows.slice(i, i + BATCH) as any, { onConflict: 'project_id,activity_id' })
          .select('id')
        upserted += unwrap(res, []).length
      }
      return { upserted, projectId }
    },
    onSuccess: ({ projectId }) => qc.invalidateQueries({ queryKey: ['schedule_activities', projectId] }),
  })
}

// ── QTO Lines ─────────────────────────────────────────────────────
export function useQtoLines(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['qto_lines', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<QtoLine[]> => unwrap(
      await supabase.from('qto_lines').select('*').eq('project_id', projectId!).order('created_at'),
      []
    ),
  })
}

export function useCreateQtoLine() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: QtoLineInsert): Promise<QtoLine> =>
      unwrap(await supabase.from('qto_lines').insert(input as any).select().single()),
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['qto_lines', r.project_id] }),
  })
}

export function useUpdateQtoLine() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: QtoLineUpdate }): Promise<QtoLine> =>
      unwrap(await supabase.from('qto_lines').update(data as any).eq('id', id).select().single()),
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['qto_lines', r.project_id] }),
  })
}

export function useDeleteQtoLine() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }): Promise<void> => {
      const { error } = await supabase.from('qto_lines').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['qto_lines', vars.projectId] }),
  })
}

export function useDeleteCertificate() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }): Promise<void> => {
      const { error } = await supabase.from('subcontractor_invoices').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: qk.certificates.list(vars.projectId) })
      qc.invalidateQueries({ queryKey: qk.dashboard.kpis(vars.projectId) })
    },
  })
}

// ── Villa Units ───────────────────────────────────────────────────
export function useVillaUnits(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['villa_units', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<VillaUnit[]> => unwrap(
      await supabase.from('villa_units').select('*').eq('project_id', projectId!).order('villa_no'),
      []
    ),
  })
}

export function useBulkCreateVillaUnits() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, units }: { projectId: string; units: Omit<VillaUnitInsert, 'project_id'>[] }): Promise<VillaUnit[]> => {
      const rows: VillaUnitInsert[] = units.map(u => ({ ...u, project_id: projectId }))
      return unwrap(await supabase.from('villa_units').insert(rows as any).select(), [])
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['villa_units', vars.projectId] }),
  })
}

export function useUpdateVillaUnit() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VillaUnitInsert> }): Promise<VillaUnit> =>
      unwrap(await supabase.from('villa_units').update(data as any).eq('id', id).select().single()),
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['villa_units', r.project_id] }),
  })
}

export function useDeleteVillaUnit() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }): Promise<void> => {
      const { error } = await supabase.from('villa_units').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['villa_units', vars.projectId] }),
  })
}

// ── Villa Progress ─────────────────────────────────────────────────
export function useVillaProgress(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['villa_progress', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<VillaProgress[]> => unwrap(
      await supabase.from('villa_progress').select('*').eq('project_id', projectId!),
      []
    ),
  })
}

export function useUpsertVillaProgress() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: VillaProgressInsert): Promise<VillaProgress> =>
      unwrap(await supabase.from('villa_progress').upsert(input as any, { onConflict: 'villa_unit_id,trade' }).select().single()),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['villa_progress', r.project_id] })
      qc.invalidateQueries({ queryKey: ['villa_units', r.project_id] })
    },
  })
}

// ── Invoice Lines ─────────────────────────────────────────────────
export function useInvoiceLines(invoiceId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['invoice_lines', invoiceId],
    enabled: !!invoiceId,
    queryFn: async (): Promise<any[]> => unwrap(
      await supabase.from('subcontractor_invoice_lines')
        .select('*, subcontract_breakdown(assignment_key, subcontract_qty, rate, boq_items(item_code, description, unit, boq_qty))')
        .eq('invoice_id', invoiceId!),
      []
    ),
  })
}

export function useBulkUpsertInvoiceLines() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ invoiceId, lines }: { invoiceId: string; lines: any[] }): Promise<any[]> => {
      // Delete existing lines first
      await supabase.from('subcontractor_invoice_lines').delete().eq('invoice_id', invoiceId)
      if (!lines.length) return []
      return unwrap(await supabase.from('subcontractor_invoice_lines').insert(lines).select(), [])
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['invoice_lines', vars.invoiceId] }),
  })
}

export function usePreviousCumulativeQty(projectId: string | null, subcontractorId: string | null, breakdownId: string | null, currentInvoiceId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['prev_cumulative', projectId, subcontractorId, breakdownId, currentInvoiceId],
    enabled: !!projectId && !!subcontractorId && !!breakdownId,
    queryFn: async (): Promise<number> => {
      // Get all approved/paid invoices BEFORE current one for this subcontractor
      const { data: invoices } = await supabase.from('subcontractor_invoices')
        .select('id, created_at')
        .eq('project_id', projectId!)
        .eq('subcontractor_id', subcontractorId!)
        .in('status', ['Approved', 'Paid'])
        .order('created_at', { ascending: true })
      
      if (!invoices?.length) return 0
      
      // Filter invoices before current one
      const currentInvoice = currentInvoiceId ? invoices.find(i => i.id === currentInvoiceId) : null
      const prevInvoices = currentInvoice 
        ? invoices.filter(i => new Date(i.created_at) < new Date(currentInvoice.created_at))
        : invoices
      
      if (!prevInvoices.length) return 0
      
      // Sum current_qty from previous invoice lines for this breakdown
      let total = 0
      for (const inv of prevInvoices) {
        const { data: lines } = await supabase.from('subcontractor_invoice_lines')
          .select('current_qty')
          .eq('invoice_id', inv.id)
          .eq('breakdown_id', breakdownId!)
        total += (lines ?? []).reduce((s, l) => s + (l.current_qty ?? 0), 0)
      }
      return total
    },
  })
}

// ── Invoice Penalties & Additions ────────────────────────────────
export function useInvoicePenalties(invoiceId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['invoice_penalties', invoiceId],
    enabled: !!invoiceId,
    queryFn: async (): Promise<InvoicePenalty[]> => unwrap(
      await supabase.from('invoice_penalties').select('*').eq('invoice_id', invoiceId!).order('created_at'),
      []
    ),
  })
}

export function useCreateInvoicePenalty() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: InvoicePenaltyInsert): Promise<InvoicePenalty> =>
      unwrap(await supabase.from('invoice_penalties').insert(input as any).select().single()),
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['invoice_penalties', r.invoice_id] }),
  })
}

export function useDeleteInvoicePenalty() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string; invoiceId: string }): Promise<void> => {
      const { error } = await supabase.from('invoice_penalties').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['invoice_penalties', vars.invoiceId] }),
  })
}

export function useInvoiceAdditions(invoiceId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['invoice_additions', invoiceId],
    enabled: !!invoiceId,
    queryFn: async (): Promise<InvoiceAddition[]> => unwrap(
      await supabase.from('invoice_additions').select('*').eq('invoice_id', invoiceId!).order('created_at'),
      []
    ),
  })
}

export function useCreateInvoiceAddition() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: InvoiceAdditionInsert): Promise<InvoiceAddition> =>
      unwrap(await supabase.from('invoice_additions').insert(input as any).select().single()),
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['invoice_additions', r.invoice_id] }),
  })
}

export function useDeleteInvoiceAddition() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, invoiceId }: { id: string; invoiceId: string }): Promise<void> => {
      const { error } = await supabase.from('invoice_additions').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['invoice_additions', vars.invoiceId] }),
  })
}

// ── Bulk Delete Hooks ─────────────────────────────────────────────
export function useDeleteSubcontractor() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('subcontractors').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: qk.subcontractors.list(vars.projectId) }),
  })
}

export function useDeleteBreakdown() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('subcontract_breakdown').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => {
      qc.invalidateQueries({ queryKey: qk.breakdown.list(vars.projectId) })
      qc.invalidateQueries({ queryKey: qk.commercial.summary(vars.projectId) })
    },
  })
}

export function useDeleteBoqItem() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('boq_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: qk.boq.list(vars.projectId) }),
  })
}

export function useDeleteTechnical() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('technical_records').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: qk.technical.list(vars.projectId) }),
  })
}

export function useDeleteProcurement() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('procurement_records').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: qk.procurement.list(vars.projectId) }),
  })
}

export function useDeleteVariation() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('variations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: qk.variations.list(vars.projectId) }),
  })
}

export function useDeleteProject() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.projects.list() }),
  })
}

export function useDeleteQsEntry() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from('qs_entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: qk.qs.list(vars.projectId) }),
  })
}

// ── Structure Nodes ───────────────────────────────────────────────
export function useStructureNodes(projectId: string | null) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['structure_nodes', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<StructureNode[]> => unwrap(
      await supabase.from('project_structure_nodes')
        .select('*')
        .eq('project_id', projectId!)
        .order('level')
        .order('sort_order'),
      []
    ),
  })
}

export function useCreateStructureNode() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: StructureNodeInsert): Promise<StructureNode> =>
      unwrap(await supabase.from('project_structure_nodes').insert(input as any).select().single()),
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['structure_nodes', r.project_id] }),
  })
}

export function useUpdateStructureNode() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: StructureNodeUpdate }): Promise<StructureNode> =>
      unwrap(await supabase.from('project_structure_nodes').update(data as any).eq('id', id).select().single()),
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ['structure_nodes', r.project_id] }),
  })
}

export function useDeleteStructureNode() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }): Promise<void> => {
      const { error } = await supabase.from('project_structure_nodes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['structure_nodes', vars.projectId] }),
  })
}

export function useBulkCreateStructureNodes() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ projectId, nodes }: { projectId: string; nodes: Omit<StructureNodeInsert, 'project_id'>[] }): Promise<StructureNode[]> => {
      const rows = nodes.map(n => ({ ...n, project_id: projectId }))
      return unwrap(await supabase.from('project_structure_nodes').insert(rows as any).select(), [])
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['structure_nodes', vars.projectId] }),
  })
}

export function useReorderStructureNode() {
  const supabase = createClient()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, sort_order, parent_id, projectId }: { id: string; sort_order: number; parent_id: string | null; projectId: string }) => {
      const { error } = await supabase.from('project_structure_nodes').update({ sort_order, parent_id } as any).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, vars) => qc.invalidateQueries({ queryKey: ['structure_nodes', vars.projectId] }),
  })
}
