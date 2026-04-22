'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  APPROVAL_STATUSES,
  CERT_STATUSES,
  DISCIPLINES,
  PROCUREMENT_STATUSES,
  TECH_STATUSES,
  VARIATION_STATUSES,
  type BoqItemWithStructure,
  type ClientInvoice,
  type ProjectStructure,
  isUuid,
  money,
  n,
  today,
} from './lib'
import { Badge, BigMetric, Button, Card, Field, FormGrid, Input, MeterRow, Metric, Select, Table, TextArea, Toolbar } from './ui'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useProject } from '@/hooks/useProject'
import {
  useProjects,
  useCreateProject,
  useDashboardKpis,
  useCommercialSummary,
  useSubcontractors,
  useCreateSubcontractor,
  useBoqItems,
  useCreateBoqItem,
  useSubcontractBreakdown,
  useCreateBreakdown,
  useQsEntries,
  useBatchCreateQsEntries,
  useSubmitQsEntry,
  usePendingApprovals,
  useReviewQsEntry,
  useCertificates,
  useCreateCertificate,
  useApproveCertificate,
  useNextCertNo,
  useTechnicalRecords,
  useCreateTechnicalRecord,
  useSetTechnicalStatus,
  useProcurementRecords,
  useCreateProcurement,
  useVariations,
  useCreateVariation,
  useApproveVariation,
  useBulkImportBoq,
  useTenderItems,
  useCreateTenderItem,
  useDeleteTenderItem,
  useScheduleActivities,
  useBulkUpsertSchedule,
  useQtoLines,
  useCreateQtoLine,
  useUpdateQtoLine,
  useDeleteQtoLine,
  useDeleteCertificate,
  useVillaUnits,
  useBulkCreateVillaUnits,
  useUpdateVillaUnit,
  useDeleteVillaUnit,
  useVillaProgress,
  useUpsertVillaProgress,
} from '@/hooks/queries'
import type {
  ActivityStatus,
  ApprovalStatus,
  TradeType,
  BoqItem,
  CertificateStatus,
  CostCategory,
  Discipline,
  ProcurementStatus,
  TechnicalStatus,
  VariationStatus,
} from '@/types/database'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { activeProject, setActiveProject } = useProject()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeView, setActiveView] = useState('dashboard')
  const [message, setMessage] = useState<string>('')
  const [dashView, setDashView] = useState<'ceo'|'client'>('ceo')

  const supabase = useMemo(() => createClient(), [])
  const { data: projects = [], isLoading: projectsLoading } = useProjects()
  const createProject = useCreateProject()

  const projectId = activeProject?.id ?? null
  const { data: kpis } = useDashboardKpis(projectId)
  const { data: commercial = [] } = useCommercialSummary(projectId)
  const { data: subcontractors = [] } = useSubcontractors()
  const { data: boqItems = [] } = useBoqItems(projectId)
  const { data: breakdowns = [] } = useSubcontractBreakdown(projectId)
  const { data: qsEntries = [] } = useQsEntries(projectId)
  const { data: pending = [] } = usePendingApprovals(projectId)
  const { data: certificates = [] } = useCertificates(projectId)
  const { data: technical = [] } = useTechnicalRecords(projectId)
  const { data: procurement = [] } = useProcurementRecords(projectId)
  const { data: variations = [] } = useVariations(projectId)

  const createSubcontractor = useCreateSubcontractor()
  const createBoq = useCreateBoqItem()
  const createBreakdown = useCreateBreakdown()
  const createQs = useBatchCreateQsEntries()
  const submitQs = useSubmitQsEntry()
  const reviewQs = useReviewQsEntry()
  const createCertificate = useCreateCertificate()
  const deleteCertificate = useDeleteCertificate()
  const approveCertificate = useApproveCertificate()
  const createTechnical = useCreateTechnicalRecord()
  const setTechnicalStatus = useSetTechnicalStatus()
  const createProcurement = useCreateProcurement()
  const createVariation = useCreateVariation()
  const approveVariation = useApproveVariation()
  const bulkImportBoq = useBulkImportBoq()
  const { data: scheduleActivities = [] } = useScheduleActivities(projectId)
  const { data: villaUnits = [] } = useVillaUnits(projectId)
  const { data: villaProgress = [] } = useVillaProgress(projectId)
  const bulkCreateVillaUnits = useBulkCreateVillaUnits()
  const updateVillaUnit = useUpdateVillaUnit()
  const deleteVillaUnit = useDeleteVillaUnit()
  const upsertVillaProgress = useUpsertVillaProgress()
  const TRADES: TradeType[] = ['Structural', 'MEP', 'Finishing', 'External Works', 'Landscaping', 'Other']
  const [villaTab, setVillaTab] = useState<'overview'|'generate'|'tracker'|'progress'>('overview')
  const [selectedPhaseForVilla, setSelectedPhaseForVilla] = useState('')
  const [selectedTypeForVilla, setSelectedTypeForVilla] = useState('')
  const [selectedVillaUnit, setSelectedVillaUnit] = useState('')
  const [villaGenForm, setVillaGenForm] = useState({ phase_id: '', villa_type_id: '', count: '10', prefix: '', subcontractor_id: '' })
  const [villaFilterPhase, setVillaFilterPhase] = useState('')
  const [villaFilterType, setVillaFilterType] = useState('')
  const [villaFilterSub, setVillaFilterSub] = useState('')
  const [progressForm, setProgressForm] = useState<Record<string, string>>({})
  const { data: qtoLines = [] } = useQtoLines(projectId)
  const createQtoLine = useCreateQtoLine()
  const updateQtoLine = useUpdateQtoLine()
  const deleteQtoLine = useDeleteQtoLine()
  const [qsTab, setQsTab] = useState<'takeoff'|'summary'|'edit'>('takeoff')
  const [selectedBoqForQto, setSelectedBoqForQto] = useState('')
  const [selectedStructureForQto, setSelectedStructureForQto] = useState('')
  const [editingQtoLine, setEditingQtoLine] = useState<string | null>(null)
  const [qtoLineForm, setQtoLineForm] = useState({ description: '', times: '1', length: '', width: '', height: '', notes: '' })
  const [editQtoForm, setEditQtoForm] = useState({ description: '', times: '1', length: '', width: '', height: '', notes: '' })
  const bulkUpsertSchedule = useBulkUpsertSchedule()
  const [scheduleTab, setScheduleTab] = useState<'overview'|'list'|'critical'>('overview')
  const [scheduleFilter, setScheduleFilter] = useState('')
  const [scheduleUploadMsg, setScheduleUploadMsg] = useState('')
  const { data: tenderItems = [] } = useTenderItems(projectId)
  const createTenderItem = useCreateTenderItem()
  const deleteTenderItem = useDeleteTenderItem()
  const [tenderForm, setTenderForm] = useState({ boq_item_id: '', category: 'Material' as CostCategory, description: '', unit: '', qty: '0', unit_rate: '0', overhead_pct: '0', profit_pct: '0', notes: '' })
  const [selectedBoqForTender, setSelectedBoqForTender] = useState('')
  const [boqUploadError, setBoqUploadError] = useState('')
  const [tenderTab, setTenderTab] = useState<'input'|'sheet'|'summary'>('input')
  const COST_CATEGORIES: CostCategory[] = ['Material', 'Labor', 'Equipment', 'Subcontract', 'Overhead']

  const [projectForm, setProjectForm] = useState({ project_code: '', project_name: '', client: '', location: '' })
  const [subForm, setSubForm] = useState({ subcontractor_code: '', name: '', contact_person: '', phone: '', email: '' })
  const [boqForm, setBoqForm] = useState({ structure_id: '', item_code: '', description: '', unit: 'm2', boq_qty: '0', rate: '0', chapter: '', discipline: 'Structural' as Discipline, source_note: '' })
  const [breakdownForm, setBreakdownForm] = useState({ subcontractor_id: '', boq_item_id: '', assignment_key: '', boq_qty: '0', rate: '0', structure_id: '', structure_label: '', project_model: '', notes: '' })
  const [qsForm, setQsForm] = useState({ boq_item_id: '', assignment_key: '', actual_survey_qty: '', notes: '' })
  const [certForm, setCertForm] = useState({ subcontractor_id: '', invoice_no: '', invoice_date: today(), period_end: today(), gross_amount: '0', retention_pct: '5', remarks: '' })
  const [technicalForm, setTechnicalForm] = useState({ subcontractor_id: '', record_type: 'Shop Drawing', reference_no: '', subject: '', discipline: 'Structural' as Discipline, due_date: today(), priority: 'Medium', comments: '' })
  const [procForm, setProcForm] = useState({ material: '', boq_item_id: '', required_qty: '0', unit: 'm2', supplier: '', pr_date: today(), planned_delivery: today(), status: 'PR Raised' as ProcurementStatus, notes: '' })
  const [variationForm, setVariationForm] = useState({ subcontractor_id: '', boq_item_id: '', vo_no: '', description: '', type: 'Addition', qty_impact: '0', unit: 'm2', rate: '0', time_impact_days: '0', notes: '' })
  const [invoiceForm, setInvoiceForm] = useState({ id: '', invoice_no: '', invoice_date: today(), client_name: activeProject?.client ?? '', description: '', amount: '0', status: 'Draft' as ClientInvoice['status'], notes: '' })
  const [clientInvoices, setClientInvoices] = useState<ClientInvoice[]>([])
  const [structureForm, setStructureForm] = useState({ code: '', name: '', type: 'Phase' as ProjectStructure['type'], parent_id: '' })
  const [structures, setStructures] = useState<ProjectStructure[]>([])
  const [selectedStructureId, setSelectedStructureId] = useState('')
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState<string>('')
  const certSubId = certForm.subcontractor_id || null
  const { data: nextCertNo = 1 } = useNextCertNo(projectId, certSubId)
  const breakdownLookup = useMemo(() => new Map(breakdowns.map((b) => [b.id, b])), [breakdowns])
  const boqStructures = useMemo(() => structures.filter((s) => s.type === 'Building' || s.type === 'Villa'), [structures])
  const selectedBoqStructure = useMemo(() => boqStructures.find((s) => s.id === boqForm.structure_id) ?? null, [boqStructures, boqForm.structure_id])


  useEffect(() => {
    if (!activeProject && projects.length > 0) setActiveProject(projects[0])
  }, [activeProject, projects, setActiveProject])

  useEffect(() => {
    if (!projectId) return
    const key = `client_invoices_${projectId}`
    try {
      setClientInvoices(JSON.parse(window.localStorage.getItem(key) ?? '[]'))
    } catch {
      setClientInvoices([])
    }
    setInvoiceForm((prev) => ({ ...prev, client_name: activeProject?.client ?? prev.client_name }))
  }, [projectId, activeProject?.client])

  useEffect(() => {
    let cancelled = false
    async function loadStructures() {
      if (!projectId) {
        setStructures([])
        setSelectedStructureId('')
        setBoqForm((prev) => ({ ...prev, structure_id: '' }))
        setStructureForm({ code: '', name: '', type: 'Phase', parent_id: '' })
        return
      }

      const key = `project_structures_${projectId}`
      let localRows: ProjectStructure[] = []
      try {
        const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]')
        localRows = Array.isArray(parsed) ? parsed : []
      } catch {
        localRows = []
      }

      const { data: dbRows, error } = await supabase
        .from('project_structures')
        .select('id, project_id, structure_code, structure_name, structure_type, parent_id')
        .eq('project_id', projectId)
        .order('structure_name', { ascending: true })

      if (error) {
        console.error('Failed to load project structures', error)
      }

      let mapped: ProjectStructure[] = (dbRows ?? []).map((row: any) => ({
        id: row.id,
        project_id: row.project_id,
        code: row.structure_code,
        name: row.structure_name,
        type: row.structure_type,
        parent_id: row.parent_id,
      }))

      if (!mapped.length && localRows.length) {
        const tempMap = new Map<string, string>()
        const phases = localRows.filter((r) => r.type === 'Phase')
        const buildings = localRows.filter((r) => r.type === 'Building')
        const villas = localRows.filter((r) => r.type === 'Villa')
        const ordered = [...phases, ...buildings, ...villas]
        for (const row of ordered) {
          const payload = {
            project_id: projectId,
            structure_code: row.code,
            structure_name: row.name,
            structure_type: row.type,
            parent_id: row.parent_id ? (tempMap.get(row.parent_id) ?? null) : null,
            level_no: row.type === 'Phase' ? 1 : row.type === 'Building' ? 2 : 3,
            sort_order: 0,
            is_active: true,
          }
          const { data: inserted, error: insertError } = await supabase
            .from('project_structures')
            .insert(payload as any)
            .select('id, project_id, structure_code, structure_name, structure_type, parent_id')
            .single()
          if (insertError) {
            console.error('Failed to migrate local structure', insertError)
            continue
          }
          tempMap.set(row.id, inserted.id)
          mapped.push({
            id: inserted.id,
            project_id: inserted.project_id,
            code: inserted.structure_code,
            name: inserted.structure_name,
            type: inserted.structure_type,
            parent_id: inserted.parent_id,
          })
        }
      }

      if (cancelled) return
      setStructures(mapped)
      window.localStorage.setItem(key, JSON.stringify(mapped))
      setSelectedStructureId('')
      setBoqForm((prev) => ({ ...prev, structure_id: isUuid(prev.structure_id) && mapped.some((s) => s.id === prev.structure_id) ? prev.structure_id : '' }))
      setStructureForm({ code: '', name: '', type: 'Phase', parent_id: '' })
    }

    loadStructures()
    return () => { cancelled = true }
  }, [projectId, supabase])

  function saveStructures(next: ProjectStructure[]) {
    if (!projectId) return
    setStructures(next)
    window.localStorage.setItem(`project_structures_${projectId}`, JSON.stringify(next))
  }

  async function addStructure() {
    if (!projectId || !structureForm.name || !structureForm.code) return
    const payload = {
      project_id: projectId,
      structure_code: structureForm.code,
      structure_name: structureForm.name,
      structure_type: structureForm.type,
      parent_id: structureForm.parent_id || null,
      level_no: structureForm.type === 'Phase' ? 1 : structureForm.type === 'Building' ? 2 : 3,
      sort_order: 0,
      is_active: true,
    }
    const { data, error } = await supabase
      .from('project_structures')
      .insert(payload as any)
      .select('id, project_id, structure_code, structure_name, structure_type, parent_id')
    if (error) {
      setMessage(error.message)
      return
    }
    const inserted = ((data ?? []).map((row: any) => ({
      id: row.id,
      project_id: row.project_id,
      code: row.structure_code,
      name: row.structure_name,
      type: row.structure_type,
      parent_id: row.parent_id,
    })) as ProjectStructure[])
    const next = [...inserted, ...structures]
    saveStructures(next)
    const first = inserted[0]
    if (first && (first.type === 'Building' || first.type === 'Villa') && !boqForm.structure_id) {
      setBoqForm((prev) => ({ ...prev, structure_id: first.id }))
    }
    setStructureForm({ code: '', name: '', type: structureForm.type, parent_id: '' })
    setMessage('Project structure row saved successfully.')
  }

  async function removeStructure(id: string) {
    const { error } = await supabase.from('project_structures').delete().eq('id', id)
    if (error) {
      setMessage(error.message)
      return
    }
    saveStructures(structures.filter((s) => s.id !== id && s.parent_id !== id))
    if (selectedStructureId === id) setSelectedStructureId('')
    if (boqForm.structure_id === id) setBoqForm((prev) => ({ ...prev, structure_id: '' }))
    setMessage('Project structure row deleted successfully.')
  }

  useEffect(() => {
    if (!boqStructures.length) {
      setBoqForm((prev) => ({ ...prev, structure_id: '' }))
      return
    }
    setBoqForm((prev) => {
      if (prev.structure_id && boqStructures.some((s) => s.id === prev.structure_id)) return prev
      return { ...prev, structure_id: boqStructures[0].id }
    })
  }, [boqStructures])

  function saveInvoices(next: ClientInvoice[]) {
    if (!projectId) return
    setClientInvoices(next)
    window.localStorage.setItem(`client_invoices_${projectId}`, JSON.stringify(next))
  }

  function saveInvoice() {
    if (!projectId) return
    const row: ClientInvoice = {
      id: invoiceForm.id || crypto.randomUUID(),
      invoice_no: invoiceForm.invoice_no,
      invoice_date: invoiceForm.invoice_date,
      client_name: invoiceForm.client_name,
      description: invoiceForm.description,
      amount: n(invoiceForm.amount),
      status: invoiceForm.status,
      notes: invoiceForm.notes || '',
    }
    const next = invoiceForm.id ? clientInvoices.map((i) => i.id === row.id ? row : i) : [row, ...clientInvoices]
    saveInvoices(next)
    setInvoiceForm({ id: '', invoice_no: '', invoice_date: today(), client_name: activeProject?.client ?? '', description: '', amount: '0', status: 'Draft', notes: '' })
    setMessage('Client invoice saved successfully.')
  }

  function editInvoice(i: ClientInvoice) {
    setInvoiceForm({ id: i.id, invoice_no: i.invoice_no, invoice_date: i.invoice_date, client_name: i.client_name, description: i.description, amount: String(i.amount), status: i.status, notes: i.notes ?? '' })
    setActiveView('client-invoices')
  }

  function removeInvoice(id: string) {
    saveInvoices(clientInvoices.filter((i) => i.id !== id))
    setMessage('Client invoice deleted successfully.')
  }

  async function run(label: string, fn: () => Promise<unknown>) {
    try {
      await fn()
      setMessage(`${label} saved successfully.`)
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : `Failed to save ${label.toLowerCase()}.`)
    }
  }

  async function addProject() {
    await run('Project', async () => {
      const created = await createProject.mutateAsync({
        project_code: projectForm.project_code,
        project_name: projectForm.project_name,
        client: projectForm.client || null,
        location: projectForm.location || null,
        contract_value: null,
        start_date: null,
        end_date: null,
        status: 'Active',
        report_month: null,
        default_retention_pct: 5,
        notes: null,
        created_by: user?.id ?? null,
      })
      setProjectForm({ project_code: '', project_name: '', client: '', location: '' })
      setActiveProject(created)
    })
  }

  async function addSubcontractor() {
    await run('Subcontractor', async () => {
      await createSubcontractor.mutateAsync({
        subcontractor_code: subForm.subcontractor_code,
        name: subForm.name,
        contact_person: subForm.contact_person || null,
        phone: subForm.phone || null,
        email: subForm.email || null,
        address: null,
        tax_registration_no: null,
        commercial_reg_no: null,
        default_retention_pct: 5,
        advance_amount: null,
        advance_recovery_pct: null,
        status: 'Active',
        notes: null,
      })
      setSubForm({ subcontractor_code: '', name: '', contact_person: '', phone: '', email: '' })
    })
  }

  async function addBoq() {
    if (!projectId) return
    await run('BOQ item', async () => {
      if (!isUuid(boqForm.structure_id)) throw new Error('Select a valid Building / Villa first.')
      await createBoq.mutateAsync({
        project_id: projectId,
        structure_id: boqForm.structure_id,
        item_code: boqForm.item_code,
        description: boqForm.description,
        unit: boqForm.unit,
        boq_qty: n(boqForm.boq_qty),
        client_rate: n(boqForm.rate),
        chapter: boqForm.chapter || null,
        discipline: boqForm.discipline,
        csi_ref: null,
        wbs_code: null,
        source_note: boqForm.source_note || null,
        is_provisional: false,
      } as any)
      setBoqForm({ structure_id: boqForm.structure_id, item_code: '', description: '', unit: 'm2', boq_qty: '0', rate: '0', chapter: '', discipline: 'Structural', source_note: '' })
    })
  }

  async function addBreakdown() {
    if (!projectId) return
    await run('Breakdown row', async () => {
      const boq = boqItems.find((b) => b.id === breakdownForm.boq_item_id) as BoqItemWithStructure | undefined
      if (!boq) throw new Error('Select a valid BOQ item first.')
      await createBreakdown.mutateAsync({
        project_id: projectId,
        subcontractor_id: breakdownForm.subcontractor_id,
        boq_item_id: breakdownForm.boq_item_id,
        structure_id: boq.structure_id,
        assignment_key: breakdownForm.assignment_key,
        project_model: breakdownForm.project_model || null,
        subcontract_qty: boq.boq_qty,
        rate: n(breakdownForm.rate),
        notes: breakdownForm.notes || null,
        is_active: true,
      } as any)
      setBreakdownForm({ subcontractor_id: '', boq_item_id: '', assignment_key: '', boq_qty: '0', rate: '0', structure_id: '', structure_label: '', project_model: '', notes: '' })
    })
  }

  async function addQs() {
    if (!projectId) return
    await run('QS entry', async () => {
      await createQs.mutateAsync({
        projectId,
        entries: [{
          breakdown_id: null,
          boq_item_id: qsForm.boq_item_id,
          assignment_key: qsForm.assignment_key,
          cert_no: 1,
          period_end: today(),
          boq_qty: 0,
          actual_survey_qty: qsForm.actual_survey_qty ? n(qsForm.actual_survey_qty) : null,
          notes: qsForm.notes || null,
          submitted_by: user?.id ?? null,
          submitted_at: null,
          status: 'Draft',
        }],
      })
      setQsForm({ boq_item_id: '', assignment_key: '', actual_survey_qty: '', notes: '' })
    })
  }

  async function addCertificate() {
    if (!projectId) return
    await run('Certificate', async () => {
      const gross = n(certForm.gross_amount)
      const retentionPct = n(certForm.retention_pct)
      const retentionAmount = gross * retentionPct / 100
      const netAmount = gross - retentionAmount
      await createCertificate.mutateAsync({
        project_id: projectId,
        subcontractor_id: certForm.subcontractor_id,
        invoice_no: (() => {
          if (certForm.invoice_no) return certForm.invoice_no
          const sub = subcontractors.find(s => s.id === certForm.subcontractor_id)
          const initials = (sub?.name ?? 'XX').split(' ').map((w: string) => w[0]?.toUpperCase() ?? '').join('').slice(0, 3)
          return `INV-${initials}-${String(nextCertNo).padStart(3, '0')}`
        })(),
        invoice_date: certForm.invoice_date || today(),
        period_end: certForm.period_end,
        gross_amount: gross,
        retention_pct: retentionPct,
        retention_amount: retentionAmount,
        net_amount: netAmount,
        status: 'Draft',
        remarks: certForm.remarks || null,
      })
      setCertForm({ subcontractor_id: '', invoice_no: '', invoice_date: today(), period_end: today(), gross_amount: '0', retention_pct: '5', remarks: '' })
    })
  }

  async function addTechnical() {
    if (!projectId) return
    await run('Technical record', async () => {
      await createTechnical.mutateAsync({
        project_id: projectId,
        subcontractor_id: technicalForm.subcontractor_id || null,
        record_type: technicalForm.record_type as any,
        reference_no: technicalForm.reference_no,
        subject: technicalForm.subject,
        discipline: technicalForm.discipline,
        revision_no: null,
        submission_date: today(),
        due_date: technicalForm.due_date,
        response_date: null,
        status: 'Submitted',
        priority: technicalForm.priority as any,
        responsible_person: null,
        comments: technicalForm.comments || null,
        attachment_url: null,
        rejection_reason: null,
        boq_item_id: null,
        created_by: user?.id ?? null,
      })
      setTechnicalForm({ subcontractor_id: '', record_type: 'Shop Drawing', reference_no: '', subject: '', discipline: 'Structural', due_date: today(), priority: 'Medium', comments: '' })
    })
  }

  async function addProcurement() {
    if (!projectId) return
    await run('Procurement record', async () => {
      await createProcurement.mutateAsync({
        project_id: projectId,
        pr_no: `PR-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        material: procForm.material,
        boq_item_id: procForm.boq_item_id || null,
        structure_id: null,
        project_model: null,
        required_qty: n(procForm.required_qty),
        unit: procForm.unit || null,
        supplier: procForm.supplier || null,
        pr_date: procForm.pr_date,
        rfq_date: null,
        po_date: null,
        po_number: null,
        po_value: null,
        planned_delivery: procForm.planned_delivery,
        actual_delivery: null,
        notes: procForm.notes || null,
        status: procForm.status,
        created_by: user?.id ?? null,
      })
      setProcForm({ material: '', boq_item_id: '', required_qty: '0', unit: 'm2', supplier: '', pr_date: today(), planned_delivery: today(), status: 'PR Raised', notes: '' })
    })
  }

  async function addVariation() {
    if (!projectId) return
    await run('Variation', async () => {
      await createVariation.mutateAsync({
        project_id: projectId,
        subcontractor_id: variationForm.subcontractor_id || null,
        boq_item_id: variationForm.boq_item_id || null,
        vo_no: variationForm.vo_no,
        description: variationForm.description,
        structure_id: null,
        type: variationForm.type as any,
        qty_impact: n(variationForm.qty_impact),
        unit: variationForm.unit || null,
        rate: n(variationForm.rate),
        time_impact_days: n(variationForm.time_impact_days),
        status: 'Draft',
        approved_value: null,
        submitted_by: user?.id ?? null,
        approved_by: null,
        approved_at: null,
        remarks: variationForm.notes || null,
      })
      setVariationForm({ subcontractor_id: '', boq_item_id: '', vo_no: '', description: '', type: 'Addition', qty_impact: '0', unit: 'm2', rate: '0', time_impact_days: '0', notes: '' })
    })
  }

  const invoiceTotal = clientInvoices.reduce((a, b) => a + (b.amount || 0), 0)
  const invoicePaid = clientInvoices.filter((i) => i.status === 'Paid').reduce((a, b) => a + (b.amount || 0), 0)
  const invoiceCertified = clientInvoices.filter((i) => i.status === 'Certified').reduce((a, b) => a + (b.amount || 0), 0)
  const invoiceOverdue = clientInvoices.filter((i) => i.status !== 'Paid' && i.status !== 'Draft').length
  const techPending = technical.filter((r) => ['Submitted', 'Under Review', 'Overdue'].includes(r.status)).length
  const techApproved = technical.filter((r) => ['Approved', 'Approved with Comments', 'Closed'].includes(r.status)).length
  const techRejected = technical.filter((r) => r.status === 'Rejected').length
  const delayedProcurement = procurement.filter((r) => ['Delayed', 'Cancelled'].includes(r.status)).length
  const variationValue = variations.reduce((sum, v) => sum + ((v.approved_value ?? v.financial_impact ?? 0) || 0), 0)
  const forecastFinal = (activeProject?.contract_value ?? 0) + variationValue
  const phaseCount = structures.filter((s) => s.type === 'Phase').length
  const buildingCount = structures.filter((s) => s.type === 'Building').length
  const villaCount = structures.filter((s) => s.type === 'Villa').length
  const selectedStructure = structures.find((s) => s.id === selectedStructureId) ?? null
  const structureBadge = selectedStructure ? `${selectedStructure.type}: ${selectedStructure.name}` : 'All Project Areas'

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: '◈' },
    { id: 'projects', label: 'Projects', icon: '⌂' },
    { id: 'structure', label: 'Project Structure', icon: '▦' },
    { id: 'boq', label: 'BOQ', icon: '≡' },
    { id: 'subcontractors', label: 'Subcontractors', icon: '◉' },
    { id: 'breakdown', label: 'Subcontract Breakdown', icon: '⊞' },
    { id: 'qs', label: 'QS Input', icon: '✎' },
    { id: 'approvals', label: 'QS Approvals', icon: '✓' },
    { id: 'certificates', label: 'Certificates', icon: '◧' },
    { id: 'client-invoices', label: 'Client Invoices', icon: '₤' },
    { id: 'technical', label: 'Technical Office', icon: '📋' },
    { id: 'procurement', label: 'Procurement', icon: '⬡' },
    { id: 'variations', label: 'Variations', icon: '△' },
    { id: 'tendering', label: 'Tendering & Cost', icon: '💰' },
    { id: 'schedule', label: 'P6 Schedule', icon: '📅' },
    { id: 'villas', label: 'Villa Tracker', icon: '🏠' },
  ]

  const projectName = activeProject?.project_name ?? 'No project selected'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f8f6', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <nav style={{ width: sidebarOpen ? 268 : 56, background: '#fff', borderRight: '1px solid #e0e0d8', transition: 'width 0.2s', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 18px', borderBottom: '1px solid #e0e0d8' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1d9e75', letterSpacing: '0.09em', textTransform: 'uppercase' }}>Project Controls</div>
          {sidebarOpen && <div style={{ fontSize: 13, marginTop: 3 }}>Construction ERP</div>}
        </div>

        {sidebarOpen && (
          <div style={{ padding: 12, borderBottom: '1px solid #e0e0d8' }}>
            <Select value={activeProject?.id ?? ''} onChange={(e) => setActiveProject(projects.find((p) => p.id === e.target.value) ?? null)}>
              <option value="">— Select project —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.project_name}</option>)}
            </Select>
            <div style={{ marginTop: 8 }}>
              <Select value={selectedStructureId} onChange={(e) => setSelectedStructureId(e.target.value)}>
                <option value="">All phases / buildings / villas</option>
                {structures.map((s) => <option key={s.id} value={s.id}>{s.type} · {s.code} · {s.name}</option>)}
              </Select>
            </div>
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {NAV.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: sidebarOpen ? '10px 16px' : '12px 14px', cursor: 'pointer', background: activeView === item.id ? '#e1f5ee' : 'transparent', color: activeView === item.id ? '#0f6e56' : '#555', borderLeft: `3px solid ${activeView === item.id ? '#1d9e75' : 'transparent'}` }}
            >
              <span>{item.icon}</span>
              {sidebarOpen && <span style={{ fontSize: 13 }}>{item.label}</span>}
            </div>
          ))}
        </div>

        {sidebarOpen && user && (
          <div style={{ borderTop: '1px solid #e0e0d8', padding: 14, fontSize: 12 }}>
            <div style={{ marginBottom: 8, color: '#444', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            <Button tone="secondary" onClick={signOut}>Sign out</Button>
          </div>
        )}
      </nav>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ height: 56, background: '#fff', borderBottom: '1px solid #e0e0d8', display: 'flex', alignItems: 'center', gap: 12, padding: '0 18px' }}>
          <button onClick={() => setSidebarOpen((s) => !s)} style={{ border: 'none', background: 'none', fontSize: 18, cursor: 'pointer', color: '#666' }}>☰</button>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{NAV.find((n) => n.id === activeView)?.label}</div>
          <Badge text={structureBadge} tone={selectedStructure ? 'default' : 'warn'} />
          <Badge text={projectName} tone={activeProject ? 'success' : 'warn'} />
        </div>

        <div style={{ padding: 18 }}>
          {!!message && <div style={{ marginBottom: 12, padding: '10px 12px', background: '#eef9f4', color: '#0c5c46', border: '1px solid #cceadf', borderRadius: 10 }}>{message}</div>}

          {activeView === 'dashboard' && (() => {
            // ── shared helpers ──────────────────────────────────────────
            const contractValue = activeProject?.contract_value ?? 0
            const totalSubcontract = kpis?.total_subcontract_value ?? 0
            const totalCertified = kpis?.total_certified_value ?? 0
            const remaining = totalSubcontract - totalCertified
            const certPct = totalSubcontract > 0 ? (totalCertified / totalSubcontract) * 100 : 0
            const overdueCount = technical.filter(r => r.status === 'Overdue').length
            const openTech = technical.filter(r => !['Approved','Approved with Comments','Closed'].includes(r.status)).length
            const delayedProc = procurement.filter(p => p.status === 'Delayed').length
            const pendingVars = variations.filter(v => ['Submitted','Under Review'].includes(v.status))
            const approvedVars = variations.filter(v => v.status === 'Approved')
            const varValue = approvedVars.reduce((s, v) => s + (v.approved_value ?? v.financial_impact ?? 0), 0)
            const pendingCerts = certificates.filter(c => c.status === 'Draft' || c.status === 'Submitted')
            const paidCerts = certificates.filter(c => c.status === 'Paid')
            const totalRetention = certificates.reduce((s, c) => s + (c.retention_amount ?? 0), 0)
            const totalPaid = paidCerts.reduce((s, c) => s + (c.net_payable ?? 0), 0)
            const boqBudget = boqItems.reduce((s, b) => s + (b.boq_qty ?? 0) * ((b as any).client_rate ?? (b as any).rate ?? 0), 0)

            const BAR = (pct: number, color: string, h = 8) => (
              <div style={{ height: h, background: '#e8e8e8', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.5s' }} />
              </div>
            )

            const KPI = ({ label, value, sub, color = '#1a6b4a', warn = false }: { label: string; value: string; sub?: string; color?: string; warn?: boolean }) => (
              <div style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', border: '1px solid #e8e8e8', borderLeft: `4px solid ${warn ? '#e53935' : color}` }}>
                <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: warn ? '#e53935' : color }}>{value}</div>
                {sub && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{sub}</div>}
              </div>
            )

            return (
              <>
                {/* Dashboard switcher */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
                  {([['ceo', '🏢 CEO / Executive Board'], ['client', '👤 Client Dashboard']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setDashView(id)} style={{ padding: '8px 22px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: dashView === id ? '#1a1a1a' : '#f0f0f0', color: dashView === id ? '#fff' : '#333' }}>{label}</button>
                  ))}
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#888' }}>{activeProject?.project_name ?? 'No project selected'} · {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>

                {/* ══════════════════════════════════════════════════
                    CEO / EXECUTIVE BOARD DASHBOARD
                ══════════════════════════════════════════════════ */}
                {dashView === 'ceo' && <>

                  {/* Alert bar */}
                  {(overdueCount > 0 || delayedProc > 0 || pendingCerts.length > 0) && (
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                      {overdueCount > 0 && <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#c62828', fontWeight: 600 }}>🔴 {overdueCount} Overdue Technical Items</div>}
                      {delayedProc > 0 && <div style={{ background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#e65100', fontWeight: 600 }}>⚠️ {delayedProc} Delayed Procurement</div>}
                      {pendingCerts.length > 0 && <div style={{ background: '#e3f2fd', border: '1px solid #90caf9', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#1565c0', fontWeight: 600 }}>📋 {pendingCerts.length} Certificates Pending</div>}
                      {pendingVars.length > 0 && <div style={{ background: '#f3e5f5', border: '1px solid #ce93d8', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#6a1b9a', fontWeight: 600 }}>📝 {pendingVars.length} Variations Under Review</div>}
                    </div>
                  )}

                  {/* Row 1 — Financial KPIs */}
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Financial Overview</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                    <KPI label="Contract Value (BOQ)" value={money(boqBudget)} sub={`${boqItems.length} BOQ items`} color="#1565c0" />
                    <KPI label="Total Subcontract" value={money(totalSubcontract)} sub={`${subcontractors.length} subcontractors`} color="#1a6b4a" />
                    <KPI label="Certified to Date" value={money(totalCertified)} sub={`${certPct.toFixed(1)}% of subcontract`} color="#2e7d32" />
                    <KPI label="Remaining to Certify" value={money(remaining)} sub={`${(100 - certPct).toFixed(1)}% remaining`} color="#e65100" />
                    <KPI label="Approved Variations" value={money(varValue)} sub={`${approvedVars.length} VOs approved`} color="#6a1b9a" />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#666', marginBottom: 6 }}>
                      <span>Overall Certification Progress</span><span style={{ fontWeight: 700 }}>{certPct.toFixed(1)}%</span>
                    </div>
                    {BAR(certPct, '#2e7d32', 12)}
                  </div>

                  {/* Row 2 — Operations KPIs */}
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Operations & Risk</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                    <KPI label="Total Retention Held" value={money(totalRetention)} sub="from all certificates" color="#37474f" />
                    <KPI label="Total Paid to Subs" value={money(totalPaid)} sub={`${paidCerts.length} paid certificates`} color="#1a6b4a" />
                    <KPI label="Open Technical Items" value={openTech.toString()} sub={`${overdueCount} overdue`} color="#1565c0" warn={overdueCount > 0} />
                    <KPI label="Procurement Items" value={procurement.length.toString()} sub={`${delayedProc} delayed`} color="#e65100" warn={delayedProc > 0} />
                    <KPI label="Pending QS Approvals" value={pending.length.toString()} sub="awaiting review" color="#6a1b9a" warn={pending.length > 0} />
                  </div>

                  {/* Row 3 — Subcontractor performance + Certificates */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, marginBottom: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Subcontractor Performance</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead><tr style={{ background: '#f5f5f5' }}>
                          {['Subcontractor', 'Contract', 'Certified', 'Retention', 'Progress'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '2px solid #eee', fontWeight: 600 }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {commercial.map(r => {
                            const pct = r.total_contract_value > 0 ? (r.total_certified_gross / r.total_contract_value) * 100 : 0
                            const ret = certificates.filter(c => c.subcontractor_id === r.subcontractor_id).reduce((s, c) => s + (c.retention_amount ?? 0), 0)
                            return (
                              <tr key={r.subcontractor_id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.subcontractor_name}</td>
                                <td style={{ padding: '8px 10px' }}>{money(r.total_contract_value)}</td>
                                <td style={{ padding: '8px 10px' }}>{money(r.total_certified_gross)}</td>
                                <td style={{ padding: '8px 10px', color: '#37474f' }}>{money(ret)}</td>
                                <td style={{ padding: '8px 10px', minWidth: 120 }}>
                                  {BAR(pct, pct >= 80 ? '#2e7d32' : pct >= 50 ? '#f9a825' : '#e53935')}
                                  <span style={{ fontSize: 11, color: '#666' }}>{pct.toFixed(1)}%</span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Latest Certificates</div>
                      {certificates.slice(0, 7).map(c => {
                        const sub = subcontractors.find(s => s.id === c.subcontractor_id)
                        const statusColor: Record<string, string> = { Paid: '#2e7d32', Approved: '#1565c0', Submitted: '#e65100', Draft: '#888', Cancelled: '#c62828' }
                        return (
                          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{sub?.subcontractor_code ?? '—'} · Cert #{c.cert_no}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>{c.period_end}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, fontSize: 13 }}>{money(c.net_amount ?? c.net_payable ?? 0)}</div>
                              <div style={{ fontSize: 11, color: statusColor[c.status] ?? '#888', fontWeight: 600 }}>{c.status}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Row 4 — Technical + Procurement + Variations */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* Technical */}
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Technical Office</div>
                      {(['RFI','Material Submittal','Shop Drawing','Method Statement','NCR','Inspection Request'] as const).map(type => {
                        const items = technical.filter(t => t.record_type === type)
                        const open = items.filter(t => !['Approved','Approved with Comments','Closed'].includes(t.status)).length
                        const overdue = items.filter(t => t.status === 'Overdue').length
                        if (!items.length) return null
                        return (
                          <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                            <span style={{ color: '#444' }}>{type}</span>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <span style={{ color: '#1565c0' }}>{open} open</span>
                              {overdue > 0 && <span style={{ color: '#c62828', fontWeight: 700 }}>⚠ {overdue}</span>}
                            </div>
                          </div>
                        )
                      })}
                      {!technical.length && <div style={{ color: '#888', fontSize: 13 }}>No technical records</div>}
                    </div>

                    {/* Procurement */}
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Procurement Status</div>
                      {(['PR Raised','RFQ Issued','PO Issued','Partially Delivered','Delivered','Delayed'] as const).map(status => {
                        const count = procurement.filter(p => p.status === status).length
                        if (!count) return null
                        const color: Record<string, string> = { Delayed: '#c62828', 'PR Raised': '#1565c0', 'RFQ Issued': '#e65100', 'PO Issued': '#f9a825', 'Partially Delivered': '#2e7d32', Delivered: '#1a6b4a' }
                        return (
                          <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f5f5f5', fontSize: 13 }}>
                            <span style={{ color: color[status] ?? '#444', fontWeight: status === 'Delayed' ? 700 : 400 }}>{status === 'Delayed' ? '⚠ ' : ''}{status}</span>
                            <span style={{ fontWeight: 700, color: color[status] ?? '#333' }}>{count}</span>
                          </div>
                        )
                      })}
                      {!procurement.length && <div style={{ color: '#888', fontSize: 13 }}>No procurement records</div>}
                    </div>

                    {/* Variations */}
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Variations Register</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                        <div style={{ background: '#e8f5e9', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontSize: 11, color: '#666' }}>Approved Value</div>
                          <div style={{ fontWeight: 800, color: '#2e7d32', fontSize: 16 }}>{money(varValue)}</div>
                        </div>
                        <div style={{ background: '#f3e5f5', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontSize: 11, color: '#666' }}>Under Review</div>
                          <div style={{ fontWeight: 800, color: '#6a1b9a', fontSize: 16 }}>{pendingVars.length} VOs</div>
                        </div>
                      </div>
                      {variations.slice(0, 5).map(v => (
                        <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f5f5f5', fontSize: 12 }}>
                          <span style={{ color: '#444' }}>{v.vo_no} · {v.type}</span>
                          <span style={{ fontWeight: 600, color: v.status === 'Approved' ? '#2e7d32' : v.status === 'Rejected' ? '#c62828' : '#e65100' }}>{v.status}</span>
                        </div>
                      ))}
                      {!variations.length && <div style={{ color: '#888', fontSize: 13 }}>No variations</div>}
                    </div>
                  </div>

                  {/* Row 5 — BOQ Progress by Discipline */}
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>BOQ Budget by Discipline</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                      {(['Structural','Architectural','MEP','Civil','Landscaping','Fit-Out','Facade','Infrastructure','Other'] as const).map(disc => {
                        const items = boqItems.filter(b => b.discipline === disc)
                        if (!items.length) return null
                        const budget = items.reduce((s, b) => s + (b.boq_qty ?? 0) * ((b as any).client_rate ?? (b as any).rate ?? 0), 0)
                        const pct = boqBudget > 0 ? (budget / boqBudget) * 100 : 0
                        return (
                          <div key={disc} style={{ padding: '10px 14px', background: '#f8f8f8', borderRadius: 8 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{disc}</div>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{money(budget)}</div>
                            {BAR(pct, '#1565c0')}
                            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{pct.toFixed(1)}% of total · {items.length} items</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>}

                {/* ══════════════════════════════════════════════════
                    CLIENT DASHBOARD
                ══════════════════════════════════════════════════ */}
                {dashView === 'client' && <>
                  {/* Header */}
                  <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: 14, padding: '24px 32px', marginBottom: 24, color: '#fff' }}>
                    <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Project Status Report</div>
                    <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{activeProject?.project_name ?? 'Project'}</div>
                    <div style={{ fontSize: 13, color: '#aaa' }}>Client: {activeProject?.client ?? '—'} &nbsp;·&nbsp; Location: {activeProject?.location ?? '—'} &nbsp;·&nbsp; As of {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20, marginTop: 20 }}>
                      {[
                        ['Contract Value', money(boqBudget)],
                        ['Certified to Date', money(totalCertified)],
                        ['Completion', certPct.toFixed(1) + '%'],
                        ['Status', activeProject?.status ?? '—'],
                      ].map(([l, v]) => (
                        <div key={l} style={{ borderLeft: '3px solid rgba(255,255,255,0.2)', paddingLeft: 16 }}>
                          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{l}</div>
                          <div style={{ fontSize: 18, fontWeight: 800 }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Overall Project Progress</span>
                      <span style={{ fontWeight: 800, fontSize: 18, color: '#1a6b4a' }}>{certPct.toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 20, background: '#e8f5e9', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ width: `${certPct}%`, height: '100%', background: 'linear-gradient(90deg, #2e7d32, #66bb6a)', borderRadius: 999, transition: 'width 1s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888' }}>
                      <span>Certified: {money(totalCertified)}</span>
                      <span>Remaining: {money(remaining)}</span>
                    </div>
                  </div>

                  {/* Client financial summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
                    {[
                      ['Total Certified (Gross)', money(totalCertified), '#1565c0', `${certPct.toFixed(1)}% complete`],
                      ['Retention Held', money(totalRetention), '#37474f', 'to be released at completion'],
                      ['Net Amount Certified', money(totalCertified - totalRetention), '#1a6b4a', 'after retention deductions'],
                    ].map(([l, v, c, s]) => (
                      <div key={l} style={{ background: '#fff', border: `2px solid ${c}`, borderRadius: 12, padding: '18px 22px' }}>
                        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{l}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>{s}</div>
                      </div>
                    ))}
                  </div>

                  {/* Payment certificates table */}
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20, marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Payment Certificate History</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead><tr style={{ background: '#f5f5f5' }}>
                        {['Cert #','Period','Subcontractor','Gross Amount','Retention','Net Payable','Status'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #eee', fontWeight: 600 }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {certificates.length ? certificates.map(c => {
                          const sub = subcontractors.find(s => s.id === c.subcontractor_id)
                          const statusColor: Record<string, string> = { Paid: '#2e7d32', Approved: '#1565c0', Submitted: '#e65100', Draft: '#888' }
                          return (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '9px 12px', fontWeight: 700 }}>#{c.cert_no}</td>
                              <td style={{ padding: '9px 12px', color: '#666' }}>{c.period_end}</td>
                              <td style={{ padding: '9px 12px' }}>{sub?.name ?? '—'}</td>
                              <td style={{ padding: '9px 12px' }}>{money(c.gross_amount)}</td>
                              <td style={{ padding: '9px 12px', color: '#37474f' }}>{money(c.retention_amount)}</td>
                              <td style={{ padding: '9px 12px', fontWeight: 700 }}>{money(c.net_amount ?? c.net_payable ?? 0)}</td>
                              <td style={{ padding: '9px 12px' }}><span style={{ background: statusColor[c.status] + '22', color: statusColor[c.status] ?? '#888', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{c.status}</span></td>
                            </tr>
                          )
                        }) : <tr><td colSpan={7} style={{ padding: 20, color: '#888', textAlign: 'center' }}>No certificates yet</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {/* Approved Variations for client */}
                  {approvedVars.length > 0 && (
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20, marginBottom: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Approved Variations</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead><tr style={{ background: '#f5f5f5' }}>{['VO No','Type','Description','Approved Value','Time Impact'].map(h => <th key={h} style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #eee' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {approvedVars.map(v => (
                            <tr key={v.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 700 }}>{v.vo_no}</td>
                              <td style={{ padding: '8px 12px' }}>{v.type}</td>
                              <td style={{ padding: '8px 12px' }}>{v.description}</td>
                              <td style={{ padding: '8px 12px', fontWeight: 700, color: '#2e7d32' }}>{money(v.approved_value ?? v.financial_impact ?? 0)}</td>
                              <td style={{ padding: '8px 12px', color: v.time_impact_days ? '#e65100' : '#888' }}>{v.time_impact_days ? `+${v.time_impact_days} days` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* BOQ progress by discipline for client */}
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Scope Progress by Discipline</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                      {(['Structural','Architectural','MEP','Civil','Landscaping','Fit-Out','Facade','Infrastructure'] as const).map(disc => {
                        const items = boqItems.filter(b => b.discipline === disc)
                        if (!items.length) return null
                        const budget = items.reduce((s, b) => s + (b.boq_qty ?? 0) * ((b as any).client_rate ?? (b as any).rate ?? 0), 0)
                        const pct = boqBudget > 0 ? (budget / boqBudget) * 100 : 0
                        return (
                          <div key={disc} style={{ padding: '14px', background: '#f8fffe', border: '1px solid #c8e6c9', borderRadius: 10 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1a6b4a', marginBottom: 8 }}>{disc}</div>
                            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{money(budget)}</div>
                            {BAR(pct, '#1a6b4a', 6)}
                            <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{pct.toFixed(1)}% of contract</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>}
              </>
            )
          })()}

          {activeView === 'projects' && (
            <>
              <Card title="Add project">
                <FormGrid>
                  <Field label="Project Code"><Input value={projectForm.project_code} onChange={(e) => setProjectForm({ ...projectForm, project_code: e.target.value })} /></Field>
                  <Field label="Project Name"><Input value={projectForm.project_name} onChange={(e) => setProjectForm({ ...projectForm, project_name: e.target.value })} /></Field>
                  <Field label="Client"><Input value={projectForm.client} onChange={(e) => setProjectForm({ ...projectForm, client: e.target.value })} /></Field>
                  <Field label="Location"><Input value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} /></Field>
                </FormGrid>
                <Toolbar><Button onClick={addProject} disabled={createProject.isPending || !projectForm.project_code || !projectForm.project_name}>Add Project</Button></Toolbar>
              </Card>
              <Card title="Projects list">
                <Table heads={['Code', 'Name', 'Client', 'Location', 'Status']} rows={projects.map((p) => [p.project_code, p.project_name, p.client ?? '—', p.location ?? '—', p.status])} />
              </Card>
            </>
          )}


          {activeView === 'structure' && (
            <>
              <Card title="Add project structure row">
                {!projectId ? <div>Select a project first.</div> : <>
                  {boqStructures.length === 0 && <div style={{ marginBottom: 12, color: '#8a5a00' }}>Create at least one Building or Villa in Project Structure first.</div>}
                  <FormGrid>
                    <Field label="Type"><Select value={structureForm.type} onChange={(e) => setStructureForm({ ...structureForm, type: e.target.value as ProjectStructure['type'], parent_id: '' })}><option>Phase</option><option>Building</option><option>Villa</option></Select></Field>
                    <Field label="Code"><Input value={structureForm.code} onChange={(e) => setStructureForm({ ...structureForm, code: e.target.value })} /></Field>
                    <Field label="Name"><Input value={structureForm.name} onChange={(e) => setStructureForm({ ...structureForm, name: e.target.value })} /></Field>
                    <Field label="Parent"><Select value={structureForm.parent_id} onChange={(e) => setStructureForm({ ...structureForm, parent_id: e.target.value })}>
                      <option value="">No parent</option>
                      {structures.filter((s) => structureForm.type === 'Phase' ? false : structureForm.type === 'Building' ? s.type === 'Phase' : s.type === 'Building').map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
                    </Select></Field>
                  </FormGrid>
                  <Toolbar><Button onClick={addStructure} disabled={!projectId || !structureForm.code || !structureForm.name}>Add Structure Row</Button></Toolbar>
                </>}
              </Card>
              <Card title="Structure register" action={<Badge text={`${phaseCount} phases · ${buildingCount} buildings · ${villaCount} villas`} tone="default" />}>
                <Table
                  heads={['Type', 'Code', 'Name', 'Parent', 'Action']}
                  rows={structures.map((s) => {
                    const parent = structures.find((p) => p.id === s.parent_id)
                    return [
                      s.type,
                      s.code,
                      s.name,
                      parent ? `${parent.code} · ${parent.name}` : '—',
                      <Button key={s.id} tone="danger" onClick={() => removeStructure(s.id)}>Delete</Button>,
                    ]
                  })}
                />
              </Card>
            </>
          )}

          {activeView === 'subcontractors' && (
            <>
              <Card title="Add subcontractor">
                <FormGrid>
                  <Field label="Code"><Input value={subForm.subcontractor_code} onChange={(e) => setSubForm({ ...subForm, subcontractor_code: e.target.value })} /></Field>
                  <Field label="Name"><Input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} /></Field>
                  <Field label="Contact"><Input value={subForm.contact_person} onChange={(e) => setSubForm({ ...subForm, contact_person: e.target.value })} /></Field>
                  <Field label="Phone"><Input value={subForm.phone} onChange={(e) => setSubForm({ ...subForm, phone: e.target.value })} /></Field>
                  <Field label="Email"><Input value={subForm.email} onChange={(e) => setSubForm({ ...subForm, email: e.target.value })} /></Field>
                </FormGrid>
                <Toolbar><Button onClick={addSubcontractor} disabled={createSubcontractor.isPending || !subForm.subcontractor_code || !subForm.name}>Add Subcontractor</Button></Toolbar>
              </Card>
              <Card title="Subcontractors list">
                <Table heads={['Code', 'Name', 'Contact', 'Phone', 'Status']} rows={subcontractors.map((s) => [s.subcontractor_code, s.name, s.contact_person ?? '—', s.phone ?? '—', s.status])} />
              </Card>
            </>
          )}

          {activeView === 'boq' && (
            <>
              <Card title="Add BOQ item">
                {!projectId ? <div>Select a project first.</div> : <>
                  <FormGrid>
                    <Field label="Building / Villa">
                      <Select value={boqForm.structure_id} onChange={(e) => setBoqForm({ ...boqForm, structure_id: e.target.value })}>
                        <option value="">Select Building / Villa</option>
                        {boqStructures.map((s) => <option key={s.id} value={s.id}>{s.type} — {s.code} — {s.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="Item Code"><Input value={boqForm.item_code} onChange={(e) => setBoqForm({ ...boqForm, item_code: e.target.value })} /></Field>
                    <Field label="Description"><Input value={boqForm.description} onChange={(e) => setBoqForm({ ...boqForm, description: e.target.value })} /></Field>
                    <Field label="Unit"><Input value={boqForm.unit} onChange={(e) => setBoqForm({ ...boqForm, unit: e.target.value })} /></Field>
                    <Field label="BOQ Qty"><Input type="number" value={boqForm.boq_qty} onChange={(e) => setBoqForm({ ...boqForm, boq_qty: e.target.value })} /></Field>
                    <Field label="Client Rate"><Input type="number" value={boqForm.rate} onChange={(e) => setBoqForm({ ...boqForm, rate: e.target.value })} /></Field>
                    <Field label="Chapter"><Input value={boqForm.chapter} onChange={(e) => setBoqForm({ ...boqForm, chapter: e.target.value })} /></Field>
                    <Field label="Discipline"><Select value={boqForm.discipline} onChange={(e) => setBoqForm({ ...boqForm, discipline: e.target.value as Discipline })}>{DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}</Select></Field>
                    <Field label="Source Note"><Input value={boqForm.source_note} onChange={(e) => setBoqForm({ ...boqForm, source_note: e.target.value })} /></Field>
                  </FormGrid>
                  <Toolbar><Button onClick={addBoq} disabled={createBoq.isPending || !boqForm.structure_id || !boqForm.item_code || !boqForm.description}>Add BOQ Item</Button></Toolbar>
                </>}
              </Card>
              <Card title="BOQ list">
                <Toolbar>
                  <Button tone="secondary" onClick={() => {
                    // Build CSV with BOM for Excel compatibility
                    const rows = [['Structure','Code','Description','Unit','Qty','Rate','Discipline']]
                    boqItems.forEach((b: BoqItemWithStructure) => {
                      const s = structures.find((st) => st.id === b.structure_id)
                      rows.push([s ? `${s.type} — ${s.code}` : '', b.item_code, b.description, b.unit, String(b.boq_qty), String(b.client_rate ?? (b as any).rate ?? 0), b.discipline ?? ''])
                    })
                    const csv = '\uFEFF' + rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\r\n')
                    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv); a.download = 'boq-template.csv'; a.click()
                  }}>⬇ Download BOQ Template</Button>
                  <label style={{cursor:'pointer'}}>
                    <span style={{padding:'6px 14px',background:'#e8f5e9',border:'1px solid #a5d6a7',borderRadius:6,fontSize:13,fontWeight:600}}>⬆ Upload BOQ (CSV)</span>
                    <input type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={async (e) => {
                      if (!projectId) return
                      const file = e.target.files?.[0]; if (!file) return
                      setBoqUploadError('')
                      try {
                        let rows: string[][] = []
                        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                          // Use SheetJS for Excel files
                          const XLSX = await import('xlsx')
                          const buf = await file.arrayBuffer()
                          const wb = XLSX.read(buf, { type: 'array' })
                          const ws = wb.Sheets[wb.SheetNames[0]]
                          rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as string[][]
                        } else {
                          // CSV parsing with proper quote handling
                          const text = await file.text()
                          const cleaned = text.replace(/^\uFEFF/, '') // strip BOM
                          rows = cleaned.trim().split(/\r?\n/).map(line => {
                            const result: string[] = []
                            let cur = '', inQ = false
                            for (let i = 0; i < line.length; i++) {
                              if (line[i] === '"') {
                                if (inQ && line[i+1] === '"') { cur += '"'; i++ }
                                else inQ = !inQ
                              } else if (line[i] === ',' && !inQ) {
                                result.push(cur.trim()); cur = ''
                              } else cur += line[i]
                            }
                            result.push(cur.trim())
                            return result
                          })
                        }
                        const dataRows = rows.slice(1).filter(r => r.length >= 2)
                        const structureMap = new Map(structures.map(s => [`${s.type} — ${s.code}`, s.id]))
                        const items = dataRows.map(cols => {
                          const [structureLabel, item_code, description, unit, qty, rate, discipline] = cols.map(String)
                          return { structure_id: structureMap.get(structureLabel?.trim()) ?? null, item_code: item_code?.trim(), description: description?.trim(), unit: unit?.trim() || 'm2', boq_qty: parseFloat(qty)||0, client_rate: parseFloat(rate)||0, discipline: discipline?.trim()||null, is_provisional: false }
                        }).filter(i => i.item_code && i.description)
                        if (!items.length) { setBoqUploadError('No valid rows found. Make sure the file matches the downloaded template.'); return }
                        await bulkImportBoq.mutateAsync({ projectId, items })
                        e.target.value = ''
                      } catch(err) {
                        setBoqUploadError('Failed to parse file: ' + String(err))
                      }
                    }} />
                  </label>
                  {boqUploadError && <span style={{color:'#e53e3e',fontSize:13}}>{boqUploadError}</span>}
                  {bulkImportBoq.isPending && <span style={{fontSize:13,color:'#666'}}>Importing...</span>}
                  {bulkImportBoq.isSuccess && <span style={{fontSize:13,color:'#2e7d32'}}>✓ Import successful</span>}
                </Toolbar>
                <Table heads={['Structure', 'Code', 'Description', 'Unit', 'Qty', 'Rate', 'Discipline']} rows={boqItems.map((b: BoqItemWithStructure) => {
                  const structure = structures.find((s) => s.id === b.structure_id)
                  return [
                    structure ? `${structure.type} — ${structure.code}` : (b.structure_id || '—'),
                    b.item_code,
                    b.description,
                    b.unit,
                    b.boq_qty,
                    money(b.client_rate ?? b.rate ?? null),
                    b.discipline ?? '—',
                  ]
                })} />
              </Card>
            </>
          )}

          {activeView === 'breakdown' && (
            <>
              <Card title="Add subcontract breakdown row">
                {!projectId ? <div>Select a project first.</div> : <>
                  <FormGrid>
                    <Field label="Subcontractor"><Select value={breakdownForm.subcontractor_id} onChange={(e) => setBreakdownForm({ ...breakdownForm, subcontractor_id: e.target.value })}><option value="">Select</option>{subcontractors.map((s) => <option key={s.id} value={s.id}>{s.subcontractor_code} — {s.name}</option>)}</Select></Field>
                    <Field label="BOQ Item"><Select value={breakdownForm.boq_item_id} onChange={(e) => {
                      const boq = boqItems.find((b) => b.id === e.target.value) as BoqItemWithStructure | undefined
                      const structure = structures.find((s) => s.id === boq?.structure_id)
                      const structureLabel = structure ? `${structure.type} — ${structure.code} — ${structure.name}` : '—'
                      setBreakdownForm({
                        ...breakdownForm,
                        boq_item_id: e.target.value,
                        assignment_key: boq ? `${boq.item_code}-${(structure?.code ?? 'NA').toUpperCase()}` : breakdownForm.assignment_key,
                        boq_qty: boq ? String(boq.boq_qty) : '0',
                        structure_id: boq?.structure_id ?? '',
                        structure_label: structureLabel,
                      })
                    }}><option value="">Select</option>{boqItems.map((b) => <option key={b.id} value={b.id}>{b.item_code} — {b.description}</option>)}</Select></Field>
                    <Field label="Assignment Key"><Input value={breakdownForm.assignment_key} onChange={(e) => setBreakdownForm({ ...breakdownForm, assignment_key: e.target.value })} /></Field>
                    <Field label="Structure"><Input value={breakdownForm.structure_label} readOnly /></Field>
                    <Field label="BOQ Qty"><Input type="number" value={breakdownForm.boq_qty} readOnly /></Field>
                    <Field label="Rate"><Input type="number" value={breakdownForm.rate} onChange={(e) => setBreakdownForm({ ...breakdownForm, rate: e.target.value })} /></Field>
                    <Field label="Model"><Input value={breakdownForm.project_model} onChange={(e) => setBreakdownForm({ ...breakdownForm, project_model: e.target.value })} /></Field>
                    <Field label="Notes"><Input value={breakdownForm.notes} onChange={(e) => setBreakdownForm({ ...breakdownForm, notes: e.target.value })} /></Field>
                  </FormGrid>
                  <Toolbar><Button onClick={addBreakdown} disabled={createBreakdown.isPending || !breakdownForm.subcontractor_id || !breakdownForm.boq_item_id || !breakdownForm.assignment_key}>Add Breakdown</Button></Toolbar>
                </>}
              </Card>
              <Card title="Breakdown list">
                <Table heads={['Assignment', 'Subcontractor', 'BOQ Item', 'Structure', 'Qty', 'Rate', 'Contract Value']} rows={breakdowns.map((r) => {
                  const boq = boqItems.find((b) => b.id === r.boq_item_id) as BoqItemWithStructure | undefined
                  const structure = structures.find((s) => s.id === boq?.structure_id)
                  const structureLabel = structure ? `${structure.type} — ${structure.code}` : '—'
                  return [
                    r.assignment_key,
                    `${r.subcontractors?.subcontractor_code ?? ''} ${r.subcontractors?.name ?? ''}`,
                    `${r.boq_items?.item_code ?? ''} ${r.boq_items?.description ?? ''}`,
                    structureLabel,
                    r.subcontract_qty,
                    money(r.rate),
                    money((r.subcontract_qty ?? 0) * (r.rate ?? 0)),
                  ]
                })} />
              </Card>
            </>
          )}

          {activeView === 'qs' && (() => {
            if (!projectId) return <Card title="QS Input"><div>Select a project first.</div></Card>

            // ── helpers ──────────────────────────────────────────────
            // For each boq_item + structure combo, find the QS entry
            const qsForItem = (boqId: string, structureId?: string) =>
              qtoLines.filter((l: any) => l.boq_item_id === boqId && (!structureId || l.structure_id === structureId))

            const effectiveQty = (boqId: string) => {
              const lines = qsForItem(boqId)
              const total = lines.reduce((s: number, l: any) => s + (l.qty ?? 0), 0)
              const boq = boqItems.find(b => b.id === boqId)
              return total > 0 ? total : (boq?.boq_qty ?? 0)
            }

            const measuredCount = boqItems.filter(b => qsForItem(b.id).length > 0).length
            const boqOnlyCount = boqItems.length - measuredCount

            return <>
              {/* Stats strip */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 8, padding: '10px 18px', fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: '#2e7d32' }}>📐 {measuredCount}</span> <span style={{ color: '#555' }}>items with QS entry</span>
                </div>
                <div style={{ background: '#fff3e0', border: '1px solid #ffcc80', borderRadius: 8, padding: '10px 18px', fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: '#e65100' }}>📋 {boqOnlyCount}</span> <span style={{ color: '#555' }}>items using BOQ qty</span>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {([['takeoff','➕ Add / Update Entry'], ['summary','📊 Summary'], ['edit','✏️ Edit']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setQsTab(id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: qsTab === id ? '#1a6b4a' : '#f0f0f0', color: qsTab === id ? '#fff' : '#333' }}>{label}</button>
                ))}
              </div>

              {/* ── TAB 1: ADD / UPDATE ── */}
              {qsTab === 'takeoff' && (
                <Card title="Add QS Entry">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <Field label="BOQ Item">
                      <Select value={selectedBoqForQto} onChange={e => { setSelectedBoqForQto(e.target.value); setSelectedStructureForQto('') }}>
                        <option value="">— Select BOQ Item —</option>
                        {boqItems.map(b => {
                          const has = qsForItem(b.id).length > 0
                          return <option key={b.id} value={b.id}>{has ? '✓ ' : ''}{b.item_code} — {b.description} ({b.unit})</option>
                        })}
                      </Select>
                    </Field>
                    <Field label="Structure (optional — for per-building entry)">
                      <Select value={selectedStructureForQto} onChange={e => setSelectedStructureForQto(e.target.value)}>
                        <option value="">All Structures / General</option>
                        {structures.filter(s => s.type === 'Building' || s.type === 'Villa').map(s => (
                          <option key={s.id} value={s.id}>{s.type} — {s.code} — {s.name}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>

                  {selectedBoqForQto && (() => {
                    const boq = boqItems.find(b => b.id === selectedBoqForQto) as any
                    const existing = qsForItem(selectedBoqForQto, selectedStructureForQto || undefined)
                    const existingEntry = existing[0]
                    const boqQty = boq?.boq_qty ?? 0
                    const struct = selectedStructureForQto ? structures.find(s => s.id === selectedStructureForQto) : null

                    return (
                      <div style={{ background: '#f8fffe', border: '1px solid #c8e6c9', borderRadius: 10, padding: 20 }}>
                        {/* Item info */}
                        <div style={{ background: '#1a6b4a', color: '#fff', borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 800 }}>{boq?.item_code} — {boq?.description}</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>Unit: {boq?.unit} · BOQ Qty: {boqQty} {boq?.unit}{struct ? ` · ${struct.type} ${struct.code}` : ''}</div>
                          </div>
                          {existingEntry && (
                            <div style={{ textAlign: 'right', fontSize: 13 }}>
                              <div style={{ opacity: 0.8 }}>Current QS Entry</div>
                              <div style={{ fontWeight: 800, fontSize: 18 }}>{existingEntry.qty} {boq?.unit}</div>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <Field label={existingEntry ? 'Update Measured Qty' : 'Measured Qty'}>
                            <Input
                              type="number"
                              value={qtoLineForm.length}
                              onChange={e => setQtoLineForm({ ...qtoLineForm, length: e.target.value })}
                              placeholder={`BOQ: ${boqQty} ${boq?.unit}`}
                            />
                          </Field>
                          <Field label="Notes (optional)">
                            <Input value={qtoLineForm.notes} onChange={e => setQtoLineForm({ ...qtoLineForm, notes: e.target.value })} placeholder="e.g. as-built measurement" />
                          </Field>
                        </div>

                        {qtoLineForm.length && (
                          <div style={{ marginTop: 10, fontSize: 13, color: '#555' }}>
                            {(() => {
                              const measured = parseFloat(qtoLineForm.length)
                              const diff = measured - boqQty
                              return <span>Entered: <strong style={{ color: '#1a6b4a', fontSize: 15 }}>{measured} {boq?.unit}</strong> &nbsp;·&nbsp; vs BOQ: <strong style={{ color: diff > 0 ? '#e65100' : diff < 0 ? '#1565c0' : '#2e7d32' }}>{diff > 0 ? '+' : ''}{diff.toFixed(3)}</strong></span>
                            })()}
                          </div>
                        )}

                        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                          <Button
                            onClick={async () => {
                              if (!qtoLineForm.length) return
                              const qty = parseFloat(qtoLineForm.length)
                              if (existingEntry) {
                                await run('Update QS', () => updateQtoLine.mutateAsync({
                                  id: existingEntry.id,
                                  data: { qty, notes: qtoLineForm.notes || null }
                                }))
                              } else {
                                await run('Add QS', () => createQtoLine.mutateAsync({
                                  project_id: projectId!,
                                  boq_item_id: selectedBoqForQto,
                                  structure_id: selectedStructureForQto || null,
                                  description: `QS Entry${struct ? ` — ${struct.code}` : ''}`,
                                  times: 1,
                                  length: qty,
                                  width: null,
                                  height: null,
                                  qty,
                                  notes: qtoLineForm.notes || null,
                                }))
                              }
                              setQtoLineForm({ description: '', times: '1', length: '', width: '', height: '', notes: '' })
                            }}
                            disabled={createQtoLine.isPending || updateQtoLine.isPending || !qtoLineForm.length}
                          >
                            {existingEntry ? '✓ Update Entry' : '+ Add Entry'}
                          </Button>
                          {existingEntry && (
                            <Button tone="danger" onClick={async () => {
                              await run('Delete QS', () => deleteQtoLine.mutateAsync({ id: existingEntry.id, projectId: projectId! }))
                              setQtoLineForm({ description: '', times: '1', length: '', width: '', height: '', notes: '' })
                            }}>Remove Entry (use BOQ qty)</Button>
                          )}
                        </div>
                      </div>
                    )
                  })()}
                </Card>
              )}

              {/* ── TAB 2: SUMMARY ── */}
              {qsTab === 'summary' && (
                <Card title="QS Summary — Effective Quantities for Payment">
                  <div style={{ marginBottom: 14, padding: '10px 16px', background: '#e3f2fd', borderRadius: 8, fontSize: 13, color: '#1565c0' }}>
                    ℹ️ Items with a QS entry use the measured quantity. Items without use the BOQ quantity automatically.
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#1a6b4a', color: '#fff' }}>
                        {['Code', 'Description', 'Unit', 'BOQ Qty', 'QS Measured Qty', 'Effective Qty', 'Structure', 'Source'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {boqItems.map((b, idx) => {
                        const entries = qsForItem(b.id)
                        const measured = entries.reduce((s: number, l: any) => s + (l.qty ?? 0), 0)
                        const usingBOQ = entries.length === 0
                        const effective = usingBOQ ? b.boq_qty : measured
                        const structIds = [...new Set(entries.map((l: any) => l.structure_id).filter(Boolean))]
                        const structLabels = structIds.map(id => structures.find(s => s.id === id)?.code ?? id).join(', ')
                        return (
                          <tr key={b.id} style={{ borderBottom: '1px solid #f0f0f0', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 700 }}>{b.item_code}</td>
                            <td style={{ padding: '8px 12px' }}>{b.description}</td>
                            <td style={{ padding: '8px 12px', color: '#666' }}>{b.unit}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right' }}>{b.boq_qty}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', color: usingBOQ ? '#aaa' : '#1a6b4a', fontWeight: usingBOQ ? 400 : 700 }}>{usingBOQ ? '—' : measured}</td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, fontSize: 14 }}>{effective}</td>
                            <td style={{ padding: '8px 12px', fontSize: 12, color: '#888' }}>{structLabels || '—'}</td>
                            <td style={{ padding: '8px 12px' }}>
                              <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: usingBOQ ? '#fff3e0' : '#e8f5e9', color: usingBOQ ? '#e65100' : '#2e7d32' }}>
                                {usingBOQ ? '📋 BOQ Qty' : '📐 QS Entry'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </Card>
              )}

              {/* ── TAB 3: EDIT ── */}
              {qsTab === 'edit' && (
                <Card title="Edit QS Entries">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#1a6b4a', color: '#fff' }}>
                        {['BOQ Item', 'Structure', 'QS Qty', 'BOQ Qty', 'Diff', 'Notes', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {qtoLines.length === 0 && (
                        <tr><td colSpan={7} style={{ padding: 24, textAlign: 'center', color: '#888' }}>No QS entries yet.</td></tr>
                      )}
                      {qtoLines.map((line: any) => {
                        const boq = boqItems.find(b => b.id === line.boq_item_id) as any
                        const struct = structures.find(s => s.id === line.structure_id)
                        const diff = (line.qty ?? 0) - (boq?.boq_qty ?? 0)
                        const isEditing = editingQtoLine === line.id
                        return (
                          <tr key={line.id} style={{ borderBottom: '1px solid #f0f0f0', background: isEditing ? '#f0f7f4' : 'white' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{boq?.item_code} — {boq?.description}</td>
                            <td style={{ padding: '8px 12px', color: '#888' }}>{struct ? `${struct.type} ${struct.code}` : 'General'}</td>
                            {isEditing ? (
                              <>
                                <td style={{ padding: '6px 8px' }}>
                                  <Input type="number" value={editQtoForm.length} onChange={e => setEditQtoForm({ ...editQtoForm, length: e.target.value })} style={{ width: 100 }} />
                                </td>
                                <td style={{ padding: '8px 12px', color: '#666' }}>{boq?.boq_qty} {boq?.unit}</td>
                                <td style={{ padding: '8px 12px' }}>—</td>
                                <td style={{ padding: '6px 8px' }}>
                                  <Input value={editQtoForm.notes} onChange={e => setEditQtoForm({ ...editQtoForm, notes: e.target.value })} />
                                </td>
                                <td style={{ padding: '6px 8px', display: 'flex', gap: 6 }}>
                                  <Button onClick={async () => {
                                    await run('Update', () => updateQtoLine.mutateAsync({
                                      id: line.id,
                                      data: { qty: parseFloat(editQtoForm.length) || 0, notes: editQtoForm.notes || null }
                                    }))
                                    setEditingQtoLine(null)
                                  }} disabled={updateQtoLine.isPending}>Save</Button>
                                  <Button tone="secondary" onClick={() => setEditingQtoLine(null)}>Cancel</Button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1a6b4a' }}>{line.qty} {boq?.unit}</td>
                                <td style={{ padding: '8px 12px', color: '#666' }}>{boq?.boq_qty} {boq?.unit}</td>
                                <td style={{ padding: '8px 12px', fontWeight: 600, color: diff > 0 ? '#e65100' : diff < 0 ? '#1565c0' : '#2e7d32' }}>{diff > 0 ? '+' : ''}{diff.toFixed(3)}</td>
                                <td style={{ padding: '8px 12px', color: '#888' }}>{line.notes ?? '—'}</td>
                                <td style={{ padding: '8px 12px', display: 'flex', gap: 6 }}>
                                  <Button tone="secondary" onClick={() => { setEditingQtoLine(line.id); setEditQtoForm({ description: line.description, times: '1', length: String(line.qty ?? ''), width: '', height: '', notes: line.notes ?? '' }) }}>Edit</Button>
                                  <Button tone="danger" onClick={() => run('Delete', () => deleteQtoLine.mutateAsync({ id: line.id, projectId: projectId! }))}>✕</Button>
                                </td>
                              </>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </Card>
              )}
            </>
          })()}

          {activeView === 'approvals' && (
            <Card title="QS approvals">
              <Table
                heads={['Assignment', 'BOQ Item', 'Pay Qty', 'Status', 'Approve / Reject']}
                rows={pending.length ? pending.map((p) => [
                  p.assignment_key,
                  boqItems.find((b) => b.id === p.breakdown_id) ? `${boqItems.find((b) => b.id === p.breakdown_id)!.item_code} — ${boqItems.find((b) => b.id === p.breakdown_id)!.description}` : p.assignment_key,
                  p.effective_pay_qty,
                  p.status,
                  <div key={p.id} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <Button disabled={reviewQs.isPending} onClick={() => run('Approval', () => reviewQs.mutateAsync({ qsEntryId: p.id, projectId: p.project_id, decision: 'Approved', approvedQty: p.effective_pay_qty ?? undefined }))}>Approve</Button>
                    <Button tone="danger" disabled={reviewQs.isPending} onClick={() => run('Approval', () => reviewQs.mutateAsync({ qsEntryId: p.id, projectId: p.project_id, decision: 'Rejected', comments: 'Rejected from dashboard' }))}>Reject</Button>
                  </div>,
                ]) : qsEntries.filter((q) => q.status === 'Submitted').map((q) => [
                  q.assignment_key,
                  boqItems.find((b) => b.id === q.boq_item_id) ? `${boqItems.find((b) => b.id === q.boq_item_id)!.item_code} — ${boqItems.find((b) => b.id === q.boq_item_id)!.description}` : q.assignment_key,
                  q.actual_survey_qty ?? q.boq_qty,
                  q.status,
                  <div key={q.id} style={{ display: 'flex', gap: 6 }}>
                    <Button disabled={reviewQs.isPending} onClick={() => run('Approval', () => reviewQs.mutateAsync({ qsEntryId: q.id, projectId: q.project_id, decision: 'Approved', approvedQty: q.actual_survey_qty ?? q.boq_qty }))}>Approve</Button>
                    <Button tone="danger" disabled={reviewQs.isPending} onClick={() => run('Approval', () => reviewQs.mutateAsync({ qsEntryId: q.id, projectId: q.project_id, decision: 'Rejected', comments: 'Rejected from dashboard' }))}>Reject</Button>
                  </div>,
                ])}
              />
            </Card>
          )}

          {activeView === 'certificates' && (
            <>
              <Card title="Create Subcontractor Invoice">
                {!projectId ? <div>Select a project first.</div> : <>
                  <FormGrid>
                    <Field label="Subcontractor"><Select value={certForm.subcontractor_id} onChange={(e) => setCertForm({ ...certForm, subcontractor_id: e.target.value })}><option value="">Select</option>{subcontractors.map((s) => <option key={s.id} value={s.id}>{s.subcontractor_code} — {s.name}</option>)}</Select></Field>
                    <Field label="Invoice No"><Input value={certForm.invoice_no} onChange={(e) => setCertForm({ ...certForm, invoice_no: e.target.value })} {...{placeholder: (() => {
                        const sub = subcontractors.find(s => s.id === certForm.subcontractor_id)
                        const initials = sub ? (sub.name ?? 'XX').split(' ').map((w: string) => w[0]?.toUpperCase() ?? '').join('').slice(0,3) : 'XXX'
                        return `Auto: INV-${initials}-${String(nextCertNo).padStart(3,'0')}`
                      })()}} /></Field>
                    <Field label="Invoice Date"><Input type="date" value={certForm.invoice_date} onChange={(e) => setCertForm({ ...certForm, invoice_date: e.target.value })} /></Field>
                    <Field label="Period End"><Input type="date" value={certForm.period_end} onChange={(e) => setCertForm({ ...certForm, period_end: e.target.value })} /></Field>
                    <Field label="Gross Amount"><Input type="number" value={certForm.gross_amount} onChange={(e) => setCertForm({ ...certForm, gross_amount: e.target.value })} /></Field>
                    <Field label="Retention %"><Input type="number" value={certForm.retention_pct} onChange={(e) => setCertForm({ ...certForm, retention_pct: e.target.value })} /></Field>
                    <Field label="Remarks"><Input value={certForm.remarks} onChange={(e) => setCertForm({ ...certForm, remarks: e.target.value })} /></Field>
                  </FormGrid>
                  {n(certForm.gross_amount) > 0 && (
                    <div style={{ margin: '12px 0', padding: '10px 16px', background: '#f0f7f4', borderRadius: 8, fontSize: 13, display: 'flex', gap: 24 }}>
                      <span>Gross: <strong>{money(n(certForm.gross_amount))}</strong></span>
                      <span>Retention ({certForm.retention_pct}%): <strong style={{ color: '#e65100' }}>{money(n(certForm.gross_amount) * n(certForm.retention_pct) / 100)}</strong></span>
                      <span>Net Amount: <strong style={{ color: '#1a6b4a', fontSize: 15 }}>{money(n(certForm.gross_amount) - n(certForm.gross_amount) * n(certForm.retention_pct) / 100)}</strong></span>
                    </div>
                  )}
                  <Toolbar><Button onClick={addCertificate} disabled={createCertificate.isPending || !certForm.subcontractor_id || !certForm.period_end}>Create Invoice</Button></Toolbar>
                </>}
              </Card>
              <Card title="Subcontractor Invoices">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#1a6b4a', color: '#fff' }}>
                      {['Subcontractor', 'Invoice No', 'Invoice Date', 'Period End', 'Gross Amount', 'Retention', 'Net Amount', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {certificates.length === 0 && (
                      <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#888' }}>No invoices yet.</td></tr>
                    )}
                    {certificates.map((c: any) => {
                      const statusColor: Record<string, string> = { Draft: '#888', Submitted: '#1565c0', Approved: '#2e7d32', Paid: '#1a6b4a', Cancelled: '#c62828' }
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{c.subcontractors ? `${c.subcontractors.subcontractor_code} — ${c.subcontractors.name}` : '—'}</td>
                          <td style={{ padding: '8px 12px' }}>{c.invoice_no}</td>
                          <td style={{ padding: '8px 12px', color: '#666' }}>{c.invoice_date}</td>
                          <td style={{ padding: '8px 12px', color: '#666' }}>{c.period_end}</td>
                          <td style={{ padding: '8px 12px' }}>{money(c.gross_amount)}</td>
                          <td style={{ padding: '8px 12px', color: '#e65100' }}>{money(c.retention_amount)}</td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1a6b4a' }}>{money(c.net_amount)}</td>
                          <td style={{ padding: '8px 12px' }}>
                            <span style={{ background: (statusColor[c.status] ?? '#888') + '22', color: statusColor[c.status] ?? '#888', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{c.status}</span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {c.status === 'Draft' && <Button tone="secondary" disabled={approveCertificate.isPending} onClick={() => run('Approve', () => approveCertificate.mutateAsync({ id: c.id, status: 'Approved' }))}>Approve</Button>}
                              {c.status === 'Approved' && <Button tone="secondary" disabled={approveCertificate.isPending} onClick={() => run('Pay', () => approveCertificate.mutateAsync({ id: c.id, status: 'Paid', paymentDate: today() }))}>Mark Paid</Button>}
                              <Button tone="danger" disabled={deleteCertificate.isPending} onClick={() => run('Delete', () => deleteCertificate.mutateAsync({ id: c.id, projectId: projectId! }))}>Delete</Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </Card>
            </>
          )}

          {activeView === 'client-invoices' && (
            <>
              <Card title={invoiceForm.id ? 'Edit client invoice' : 'Add client invoice'}>
                {!projectId ? <div>Select a project first.</div> : <>
                  <FormGrid>
                    <Field label="Invoice No"><Input value={invoiceForm.invoice_no} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_no: e.target.value })} /></Field>
                    <Field label="Invoice Date"><Input type="date" value={invoiceForm.invoice_date} onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_date: e.target.value })} /></Field>
                    <Field label="Client"><Input value={invoiceForm.client_name} onChange={(e) => setInvoiceForm({ ...invoiceForm, client_name: e.target.value })} /></Field>
                    <Field label="Amount"><Input type="number" value={invoiceForm.amount} onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })} /></Field>
                    <Field label="Status"><Select value={invoiceForm.status} onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value as ClientInvoice['status'] })}><option>Draft</option><option>Submitted</option><option>Certified</option><option>Paid</option></Select></Field>
                  </FormGrid>
                  <div style={{ marginTop: 10 }}><Field label="Description"><TextArea value={invoiceForm.description} onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })} /></Field></div>
                  <div style={{ marginTop: 10 }}><Field label="Notes"><TextArea value={invoiceForm.notes} onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })} /></Field></div>
                  <Toolbar>
                    <Button onClick={saveInvoice} disabled={!invoiceForm.invoice_no || !invoiceForm.client_name}>Save Invoice</Button>
                    {invoiceForm.id && <Button tone="secondary" onClick={() => setInvoiceForm({ id: '', invoice_no: '', invoice_date: today(), client_name: activeProject?.client ?? '', description: '', amount: '0', status: 'Draft', notes: '' })}>Cancel Edit</Button>}
                  </Toolbar>
                </>}
              </Card>
              <Card title="Client invoices register">
                <Table heads={['Invoice No', 'Date', 'Client', 'Amount', 'Status', 'Actions']} rows={clientInvoices.map((i) => [
                  i.invoice_no,
                  i.invoice_date,
                  i.client_name,
                  money(i.amount),
                  i.status,
                  <div key={i.id} style={{ display: 'flex', gap: 8 }}>
                    <Button tone="secondary" onClick={() => editInvoice(i)}>Edit</Button>
                    <Button tone="danger" onClick={() => removeInvoice(i.id)}>Delete</Button>
                  </div>,
                ])} />
              </Card>
            </>
          )}

          {activeView === 'technical' && (
            <>
              <Card title="Add technical office record">
                {!projectId ? <div>Select a project first.</div> : <>
                  <FormGrid>
                    <Field label="Subcontractor"><Select value={technicalForm.subcontractor_id} onChange={(e) => setTechnicalForm({ ...technicalForm, subcontractor_id: e.target.value })}><option value="">Optional</option>{subcontractors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
                    <Field label="Record Type"><Input value={technicalForm.record_type} onChange={(e) => setTechnicalForm({ ...technicalForm, record_type: e.target.value })} /></Field>
                    <Field label="Reference No"><Input value={technicalForm.reference_no} onChange={(e) => setTechnicalForm({ ...technicalForm, reference_no: e.target.value })} /></Field>
                    <Field label="Subject"><Input value={technicalForm.subject} onChange={(e) => setTechnicalForm({ ...technicalForm, subject: e.target.value })} /></Field>
                    <Field label="Discipline"><Select value={technicalForm.discipline} onChange={(e) => setTechnicalForm({ ...technicalForm, discipline: e.target.value as Discipline })}>{DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}</Select></Field>
                    <Field label="Due Date"><Input type="date" value={technicalForm.due_date} onChange={(e) => setTechnicalForm({ ...technicalForm, due_date: e.target.value })} /></Field>
                    <Field label="Priority"><Select value={technicalForm.priority} onChange={(e) => setTechnicalForm({ ...technicalForm, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></Select></Field>
                  </FormGrid>
                  <div style={{ marginTop: 10 }}><Field label="Comments"><TextArea value={technicalForm.comments} onChange={(e) => setTechnicalForm({ ...technicalForm, comments: e.target.value })} /></Field></div>
                  <Toolbar><Button onClick={addTechnical} disabled={createTechnical.isPending || !technicalForm.reference_no || !technicalForm.subject}>Add Technical Record</Button></Toolbar>
                </>}
              </Card>
              <Card title="Technical records">
                <Table
                  heads={['Reference', 'Subject', 'Type', 'Due Date', 'Status', 'Action']}
                  rows={technical.map((t) => [
                    t.reference_no,
                    t.subject,
                    t.record_type,
                    t.due_date ?? '—',
                    t.status,
                    <Select key={t.id} value={t.status} onChange={(e) => run('Technical status', () => setTechnicalStatus.mutateAsync({ id: t.id, status: e.target.value as TechnicalStatus, responseDate: e.target.value === 'Closed' ? today() : undefined }))}>
                      {TECH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>,
                  ])}
                />
              </Card>
            </>
          )}

          {activeView === 'procurement' && (
            <>
              <Card title="Add procurement record">
                {!projectId ? <div>Select a project first.</div> : <>
                  <FormGrid>
                    <Field label="Material"><Input value={procForm.material} onChange={(e) => setProcForm({ ...procForm, material: e.target.value })} /></Field>
                    <Field label="BOQ Item"><Select value={procForm.boq_item_id} onChange={(e) => setProcForm({ ...procForm, boq_item_id: e.target.value })}><option value="">Optional</option>{boqItems.map((b) => <option key={b.id} value={b.id}>{b.item_code}</option>)}</Select></Field>
                    <Field label="Required Qty"><Input type="number" value={procForm.required_qty} onChange={(e) => setProcForm({ ...procForm, required_qty: e.target.value })} /></Field>
                    <Field label="Unit"><Input value={procForm.unit} onChange={(e) => setProcForm({ ...procForm, unit: e.target.value })} /></Field>
                    <Field label="Supplier"><Input value={procForm.supplier} onChange={(e) => setProcForm({ ...procForm, supplier: e.target.value })} /></Field>
                    <Field label="PR Date"><Input type="date" value={procForm.pr_date} onChange={(e) => setProcForm({ ...procForm, pr_date: e.target.value })} /></Field>
                    <Field label="Planned Delivery"><Input type="date" value={procForm.planned_delivery} onChange={(e) => setProcForm({ ...procForm, planned_delivery: e.target.value })} /></Field>
                    <Field label="Status"><Select value={procForm.status} onChange={(e) => setProcForm({ ...procForm, status: e.target.value as ProcurementStatus })}>{PROCUREMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
                  </FormGrid>
                  <div style={{ marginTop: 10 }}><Field label="Notes"><TextArea value={procForm.notes} onChange={(e) => setProcForm({ ...procForm, notes: e.target.value })} /></Field></div>
                  <Toolbar><Button onClick={addProcurement} disabled={createProcurement.isPending || !procForm.material}>Add Procurement Record</Button></Toolbar>
                </>}
              </Card>
              <Card title="Procurement list">
                <Table heads={['PR No', 'Material', 'Qty', 'Supplier', 'Status', 'Planned Delivery']} rows={procurement.map((p) => [p.pr_no, p.material, `${p.required_qty ?? 0} ${p.unit ?? ''}`, p.supplier ?? '—', p.status, p.planned_delivery ?? '—'])} />
              </Card>
            </>
          )}

          {activeView === 'variations' && (
            <>
              <Card title="Add variation">
                {!projectId ? <div>Select a project first.</div> : <>
                  <FormGrid>
                    <Field label="VO No"><Input value={variationForm.vo_no} onChange={(e) => setVariationForm({ ...variationForm, vo_no: e.target.value })} /></Field>
                    <Field label="Subcontractor"><Select value={variationForm.subcontractor_id} onChange={(e) => setVariationForm({ ...variationForm, subcontractor_id: e.target.value })}><option value="">Optional</option>{subcontractors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
                    <Field label="BOQ Item"><Select value={variationForm.boq_item_id} onChange={(e) => setVariationForm({ ...variationForm, boq_item_id: e.target.value })}><option value="">Optional</option>{boqItems.map((b) => <option key={b.id} value={b.id}>{b.item_code}</option>)}</Select></Field>
                    <Field label="Type"><Select value={variationForm.type} onChange={(e) => setVariationForm({ ...variationForm, type: e.target.value })}><option>Addition</option><option>Omission</option><option>Substitution</option><option>Acceleration</option><option>Provisional Sum</option></Select></Field>
                    <Field label="Qty Impact"><Input type="number" value={variationForm.qty_impact} onChange={(e) => setVariationForm({ ...variationForm, qty_impact: e.target.value })} /></Field>
                    <Field label="Unit"><Input value={variationForm.unit} onChange={(e) => setVariationForm({ ...variationForm, unit: e.target.value })} /></Field>
                    <Field label="Rate"><Input type="number" value={variationForm.rate} onChange={(e) => setVariationForm({ ...variationForm, rate: e.target.value })} /></Field>
                    <Field label="Time Impact Days"><Input type="number" value={variationForm.time_impact_days} onChange={(e) => setVariationForm({ ...variationForm, time_impact_days: e.target.value })} /></Field>
                  </FormGrid>
                  <div style={{ marginTop: 10 }}><Field label="Description"><TextArea value={variationForm.description} onChange={(e) => setVariationForm({ ...variationForm, description: e.target.value })} /></Field></div>
                  <div style={{ marginTop: 10 }}><Field label="Remarks"><TextArea value={variationForm.notes} onChange={(e) => setVariationForm({ ...variationForm, notes: e.target.value })} /></Field></div>
                  <Toolbar><Button onClick={addVariation} disabled={createVariation.isPending || !variationForm.vo_no || !variationForm.description}>Add Variation</Button></Toolbar>
                </>}
              </Card>
              <Card title="Variations list">
                <Table
                  heads={['VO No', 'Description', 'Type', 'Status', 'Approved Value', 'Action']}
                  rows={variations.map((v) => [
                    v.vo_no,
                    v.description,
                    v.type,
                    v.status,
                    money(v.approved_value),
                    <Select key={v.id} value={v.status} onChange={(e) => {
                      const status = e.target.value as VariationStatus
                      if (status === 'Approved' || status === 'Rejected' || status === 'Partially Approved') {
                        run('Variation', () => approveVariation.mutateAsync({ id: v.id, status, approvedValue: status === 'Approved' ? (v.qty_impact ?? 0) * (v.rate ?? 0) : v.approved_value ?? 0 }))
                      }
                    }}>
                      {VARIATION_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>,
                  ])}
                />
              </Card>
            </>
          )}

          {activeView === 'tendering' && (
            <>
              {!projectId ? <Card title="Tendering & Cost Estimation"><div>Select a project first.</div></Card> : (() => {
                // ── helpers ──────────────────────────────────────────────
                const CAT_COLOR: Record<string, string> = { Material: '#1565c0', Labor: '#6a1b9a', Equipment: '#e65100', Subcontract: '#2e7d32', Overhead: '#4e342e' }
                const CAT_BG:    Record<string, string> = { Material: '#e3f2fd', Labor: '#f3e5f5', Equipment: '#fff3e0', Subcontract: '#e8f5e9', Overhead: '#efebe9' }

                const itemsForBoq = (bid: string) => tenderItems.filter((t: any) => t.boq_item_id === bid)

                const directCost = (items: any[]) => items.reduce((s: number, t: any) => s + (t.qty ?? 0) * (t.unit_rate ?? 0), 0)

                const unitRate = (bid: string, boqQty: number) => {
                  const items = itemsForBoq(bid)
                  const dc = directCost(items)
                  const oh = items.reduce((s: number, t: any) => {
                    const base = (t.qty ?? 0) * (t.unit_rate ?? 0)
                    return s + base * (t.overhead_pct ?? 0) / 100
                  }, 0)
                  const pr = items.reduce((s: number, t: any) => {
                    const base = (t.qty ?? 0) * (t.unit_rate ?? 0)
                    return s + base * (t.profit_pct ?? 0) / 100
                  }, 0)
                  const total = dc + oh + pr
                  return boqQty > 0 ? total / boqQty : 0
                }

                // ── tabs ─────────────────────────────────────────────────
                return <>
                  {/* Tab bar */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                    {([['input','📝 Price a BOQ Item'],['sheet','📊 Cost Sheets'],['summary','📈 Project Summary']] as const).map(([id, label]) => (
                      <button key={id} onClick={() => setTenderTab(id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: tenderTab === id ? '#1a6b4a' : '#f0f0f0', color: tenderTab === id ? '#fff' : '#333' }}>{label}</button>
                    ))}
                  </div>

                  {/* ── TAB 1: Price a BOQ Item ── */}
                  {tenderTab === 'input' && (
                    <Card title="Price a BOQ Item">
                      <div style={{ marginBottom: 16 }}>
                        <Field label="Select BOQ Item to Price">
                          <Select value={selectedBoqForTender} onChange={(e) => { setSelectedBoqForTender(e.target.value); setTenderForm({ ...tenderForm, boq_item_id: e.target.value }) }}>
                            <option value="">— Select BOQ Item —</option>
                            {boqItems.map((b) => {
                              const priced = itemsForBoq(b.id).length > 0
                              return <option key={b.id} value={b.id}>{priced ? '✓ ' : ''}{b.item_code} — {b.description} ({b.unit})</option>
                            })}
                          </Select>
                        </Field>
                      </div>

                      {selectedBoqForTender && (() => {
                        const boq = boqItems.find((b) => b.id === selectedBoqForTender) as BoqItemWithStructure | undefined
                        const items = itemsForBoq(selectedBoqForTender)
                        const dc = directCost(items)
                        const totalOh = items.reduce((s: number, t: any) => s + (t.qty??0)*(t.unit_rate??0)*(t.overhead_pct??0)/100, 0)
                        const totalPr = items.reduce((s: number, t: any) => s + (t.qty??0)*(t.unit_rate??0)*(t.profit_pct??0)/100, 0)
                        const totalCost = dc + totalOh + totalPr
                        const boqQty = boq?.boq_qty ?? 1
                        const calcUnitRate = boqQty > 0 ? totalCost / boqQty : 0
                        const clientRate = (boq as any)?.client_rate ?? (boq as any)?.rate ?? 0
                        const margin = clientRate > 0 ? ((clientRate - calcUnitRate) / clientRate) * 100 : 0

                        return <>
                          {/* KPI strip */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 20 }}>
                            {[
                              ['Direct Cost', money(dc), '#1565c0'],
                              ['Overhead', money(totalOh), '#e65100'],
                              ['Profit', money(totalPr), '#2e7d32'],
                              ['Total Cost', money(totalCost), '#1a6b4a'],
                              ['Calc. Unit Rate', money(calcUnitRate), margin >= 0 ? '#2e7d32' : '#c62828'],
                            ].map(([label, val, color]) => (
                              <div key={label} style={{ background: '#f8f8f8', borderRadius: 8, padding: '10px 14px', borderLeft: `4px solid ${color}` }}>
                                <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{label}</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color }}>{val}</div>
                              </div>
                            ))}
                          </div>
                          {clientRate > 0 && (
                            <div style={{ marginBottom: 16, padding: '8px 14px', background: margin >= 0 ? '#e8f5e9' : '#ffebee', borderRadius: 8, fontSize: 13 }}>
                              Client Rate: <b>{money(clientRate)}</b> &nbsp;|&nbsp; BOQ Qty: <b>{boqQty} {boq?.unit}</b> &nbsp;|&nbsp; Margin: <b style={{ color: margin >= 0 ? '#2e7d32' : '#c62828' }}>{margin.toFixed(1)}%</b>
                            </div>
                          )}

                          {/* Existing cost lines */}
                          {items.length > 0 && (
                            <div style={{ marginBottom: 20 }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                  <tr style={{ background: '#f5f5f5' }}>
                                    {['Category','Description','Unit','Qty','Unit Rate','Direct Cost','OH%','Profit%','Total',''].map(h => (
                                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((t: any) => {
                                    const base = (t.qty??0)*(t.unit_rate??0)
                                    const oh = base*(t.overhead_pct??0)/100
                                    const pr = base*(t.profit_pct??0)/100
                                    return (
                                      <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '7px 10px' }}>
                                          <span style={{ background: CAT_BG[t.category]??'#eee', color: CAT_COLOR[t.category]??'#333', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{t.category}</span>
                                        </td>
                                        <td style={{ padding: '7px 10px' }}>{t.description}</td>
                                        <td style={{ padding: '7px 10px' }}>{t.unit}</td>
                                        <td style={{ padding: '7px 10px' }}>{t.qty}</td>
                                        <td style={{ padding: '7px 10px' }}>{money(t.unit_rate)}</td>
                                        <td style={{ padding: '7px 10px', fontWeight: 600 }}>{money(base)}</td>
                                        <td style={{ padding: '7px 10px', color: '#e65100' }}>{t.overhead_pct??0}%</td>
                                        <td style={{ padding: '7px 10px', color: '#2e7d32' }}>{t.profit_pct??0}%</td>
                                        <td style={{ padding: '7px 10px', fontWeight: 700 }}>{money(base+oh+pr)}</td>
                                        <td style={{ padding: '7px 10px' }}>
                                          <button onClick={() => run('Delete', () => deleteTenderItem.mutateAsync(t.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontSize: 16 }}>✕</button>
                                        </td>
                                      </tr>
                                    )
                                  })}
                                  <tr style={{ background: '#f0f7f4', fontWeight: 700 }}>
                                    <td colSpan={5} style={{ padding: '8px 10px' }}>TOTAL</td>
                                    <td style={{ padding: '8px 10px' }}>{money(dc)}</td>
                                    <td style={{ padding: '8px 10px', color: '#e65100' }}>{money(totalOh)}</td>
                                    <td style={{ padding: '8px 10px', color: '#2e7d32' }}>{money(totalPr)}</td>
                                    <td style={{ padding: '8px 10px', color: '#1a6b4a' }}>{money(totalCost)}</td>
                                    <td></td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Add cost line form */}
                          <div style={{ background: '#f8fffe', border: '1px solid #c8e6c9', borderRadius: 10, padding: 16 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12, color: '#1a6b4a' }}>+ Add Cost Line</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                              <Field label="Category">
                                <Select value={tenderForm.category} onChange={(e) => setTenderForm({ ...tenderForm, category: e.target.value as CostCategory })}>
                                  {COST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </Select>
                              </Field>
                              <Field label="Description"><Input value={tenderForm.description} onChange={(e) => setTenderForm({ ...tenderForm, description: e.target.value })} placeholder="e.g. Steel bars" /></Field>
                              <Field label="Unit"><Input value={tenderForm.unit} onChange={(e) => setTenderForm({ ...tenderForm, unit: e.target.value })} placeholder="ton, m3…" /></Field>
                              <Field label="Qty"><Input type="number" value={tenderForm.qty} onChange={(e) => setTenderForm({ ...tenderForm, qty: e.target.value })} /></Field>
                              <Field label="Unit Rate (EGP)"><Input type="number" value={tenderForm.unit_rate} onChange={(e) => setTenderForm({ ...tenderForm, unit_rate: e.target.value })} /></Field>
                              <Field label="Overhead %"><Input type="number" value={tenderForm.overhead_pct} onChange={(e) => setTenderForm({ ...tenderForm, overhead_pct: e.target.value })} /></Field>
                              <Field label="Profit %"><Input type="number" value={tenderForm.profit_pct} onChange={(e) => setTenderForm({ ...tenderForm, profit_pct: e.target.value })} /></Field>
                              <Field label="Notes"><Input value={tenderForm.notes} onChange={(e) => setTenderForm({ ...tenderForm, notes: e.target.value })} /></Field>
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16 }}>
                              <Button onClick={async () => {
                                if (!tenderForm.boq_item_id || !tenderForm.description) return
                                await run('Cost line', () => createTenderItem.mutateAsync({
                                  project_id: projectId!,
                                  boq_item_id: tenderForm.boq_item_id,
                                  category: tenderForm.category,
                                  description: tenderForm.description,
                                  unit: tenderForm.unit || null,
                                  qty: n(tenderForm.qty),
                                  unit_rate: n(tenderForm.unit_rate),
                                  overhead_pct: n(tenderForm.overhead_pct),
                                  profit_pct: n(tenderForm.profit_pct),
                                  notes: tenderForm.notes || null,
                                }))
                                setTenderForm({ ...tenderForm, description: '', unit: '', qty: '0', unit_rate: '0', overhead_pct: '0', profit_pct: '0', notes: '' })
                              }} disabled={createTenderItem.isPending || !tenderForm.description}>
                                Add Cost Line
                              </Button>
                              {n(tenderForm.qty) > 0 && n(tenderForm.unit_rate) > 0 && (
                                <span style={{ fontSize: 13, color: '#555' }}>
                                  Preview: Direct <b>{money(n(tenderForm.qty)*n(tenderForm.unit_rate))}</b>
                                  {n(tenderForm.overhead_pct)>0 && <> + OH <b>{money(n(tenderForm.qty)*n(tenderForm.unit_rate)*n(tenderForm.overhead_pct)/100)}</b></>}
                                  {n(tenderForm.profit_pct)>0 && <> + Profit <b>{money(n(tenderForm.qty)*n(tenderForm.unit_rate)*n(tenderForm.profit_pct)/100)}</b></>}
                                  {' = '}<b style={{color:'#1a6b4a'}}>{money(n(tenderForm.qty)*n(tenderForm.unit_rate)*(1+n(tenderForm.overhead_pct)/100+n(tenderForm.profit_pct)/100))}</b>
                                </span>
                              )}
                            </div>
                          </div>
                        </>
                      })()}
                    </Card>
                  )}

                  {/* ── TAB 2: Cost Sheets ── */}
                  {tenderTab === 'sheet' && (
                    <Card title="Cost Sheets — All BOQ Items">
                      {boqItems.filter((b) => itemsForBoq(b.id).length > 0).length === 0
                        ? <div style={{ color: '#888', padding: 20 }}>No priced items yet. Go to "Price a BOQ Item" to start.</div>
                        : boqItems.filter((b) => itemsForBoq(b.id).length > 0).map((b) => {
                          const items = itemsForBoq(b.id)
                          const dc = directCost(items)
                          const totalOh = items.reduce((s: number, t: any) => s + (t.qty??0)*(t.unit_rate??0)*(t.overhead_pct??0)/100, 0)
                          const totalPr = items.reduce((s: number, t: any) => s + (t.qty??0)*(t.unit_rate??0)*(t.profit_pct??0)/100, 0)
                          const totalCost = dc + totalOh + totalPr
                          const clientRate = (b as any)?.client_rate ?? (b as any)?.rate ?? 0
                          const calcUR = b.boq_qty > 0 ? totalCost / b.boq_qty : 0
                          const margin = clientRate > 0 ? ((clientRate - calcUR) / clientRate) * 100 : null
                          return (
                            <div key={b.id} style={{ marginBottom: 28, borderRadius: 10, border: '1px solid #e0e0e0', overflow: 'hidden' }}>
                              <div style={{ background: '#1a6b4a', color: '#fff', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700 }}>{b.item_code} — {b.description}</span>
                                <span style={{ fontSize: 12, opacity: 0.85 }}>BOQ Qty: {b.boq_qty} {b.unit} &nbsp;|&nbsp; Client Rate: {money(clientRate)} &nbsp;|&nbsp; Calc. Rate: {money(calcUR)} {margin !== null && <span style={{ color: margin >= 0 ? '#a5d6a7' : '#ef9a9a' }}>({margin.toFixed(1)}%)</span>}</span>
                              </div>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                  <tr style={{ background: '#f5f5f5' }}>
                                    {['Category','Description','Unit','Qty','Unit Rate','Direct Cost','OH%','Profit%','Total'].map(h => (
                                      <th key={h} style={{ padding: '6px 10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((t: any) => {
                                    const base = (t.qty??0)*(t.unit_rate??0)
                                    const oh = base*(t.overhead_pct??0)/100
                                    const pr = base*(t.profit_pct??0)/100
                                    return (
                                      <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '6px 10px' }}><span style={{ background: CAT_BG[t.category]??'#eee', color: CAT_COLOR[t.category]??'#333', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{t.category}</span></td>
                                        <td style={{ padding: '6px 10px' }}>{t.description}</td>
                                        <td style={{ padding: '6px 10px' }}>{t.unit}</td>
                                        <td style={{ padding: '6px 10px' }}>{t.qty}</td>
                                        <td style={{ padding: '6px 10px' }}>{money(t.unit_rate)}</td>
                                        <td style={{ padding: '6px 10px', fontWeight: 600 }}>{money(base)}</td>
                                        <td style={{ padding: '6px 10px', color: '#e65100' }}>{t.overhead_pct??0}%</td>
                                        <td style={{ padding: '6px 10px', color: '#2e7d32' }}>{t.profit_pct??0}%</td>
                                        <td style={{ padding: '6px 10px', fontWeight: 700 }}>{money(base+oh+pr)}</td>
                                      </tr>
                                    )
                                  })}
                                  <tr style={{ background: '#f0f7f4', fontWeight: 700, fontSize: 13 }}>
                                    <td colSpan={5} style={{ padding: '8px 10px' }}>SUBTOTAL</td>
                                    <td style={{ padding: '8px 10px' }}>{money(dc)}</td>
                                    <td style={{ padding: '8px 10px', color: '#e65100' }}>{money(totalOh)}</td>
                                    <td style={{ padding: '8px 10px', color: '#2e7d32' }}>{money(totalPr)}</td>
                                    <td style={{ padding: '8px 10px', color: '#1a6b4a' }}>{money(totalCost)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          )
                        })
                      }
                    </Card>
                  )}

                  {/* ── TAB 3: Project Summary ── */}
                  {tenderTab === 'summary' && (() => {
                    const allPriced = boqItems.filter((b) => itemsForBoq(b.id).length > 0)
                    const projectDC = allPriced.reduce((s, b) => s + directCost(itemsForBoq(b.id)), 0)
                    const projectOH = allPriced.reduce((s, b) => s + itemsForBoq(b.id).reduce((ss: number, t: any) => ss + (t.qty??0)*(t.unit_rate??0)*(t.overhead_pct??0)/100, 0), 0)
                    const projectPR = allPriced.reduce((s, b) => s + itemsForBoq(b.id).reduce((ss: number, t: any) => ss + (t.qty??0)*(t.unit_rate??0)*(t.profit_pct??0)/100, 0), 0)
                    const projectTotal = projectDC + projectOH + projectPR
                    const clientBudget = allPriced.reduce((s, b) => s + b.boq_qty * ((b as any).client_rate ?? (b as any).rate ?? 0), 0)

                    // By category
                    const byCat = COST_CATEGORIES.map(cat => {
                      const items = tenderItems.filter((t: any) => t.category === cat)
                      const total = items.reduce((s: number, t: any) => s + (t.qty??0)*(t.unit_rate??0), 0)
                      return { cat, total, pct: projectDC > 0 ? (total/projectDC)*100 : 0 }
                    })

                    // By resource description across all items
                    const byDesc = new Map<string, { cat: string; total: number; items: number }>()
                    tenderItems.forEach((t: any) => {
                      const base = (t.qty??0)*(t.unit_rate??0)
                      const ex = byDesc.get(t.description) ?? { cat: t.category, total: 0, items: 0 }
                      byDesc.set(t.description, { cat: t.category, total: ex.total + base, items: ex.items + 1 })
                    })

                    return <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                          ['Total Direct Cost', money(projectDC), '#1565c0'],
                          ['Total Overhead', money(projectOH), '#e65100'],
                          ['Total Profit', money(projectPR), '#2e7d32'],
                          ['Project Tender Price', money(projectTotal), '#1a6b4a'],
                        ].map(([l,v,c]) => (
                          <div key={l} style={{ background: '#fff', border: `2px solid ${c}`, borderRadius: 10, padding: '14px 18px' }}>
                            <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{l}</div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {clientBudget > 0 && (
                        <div style={{ marginBottom: 20, padding: '12px 18px', background: projectTotal <= clientBudget ? '#e8f5e9' : '#ffebee', borderRadius: 10, display: 'flex', gap: 40, fontSize: 14 }}>
                          <span>Client Budget: <b>{money(clientBudget)}</b></span>
                          <span>Our Price: <b>{money(projectTotal)}</b></span>
                          <span>Difference: <b style={{ color: projectTotal <= clientBudget ? '#2e7d32' : '#c62828' }}>{money(clientBudget - projectTotal)}</b></span>
                          <span>Margin: <b style={{ color: projectTotal <= clientBudget ? '#2e7d32' : '#c62828' }}>{clientBudget > 0 ? (((clientBudget - projectTotal) / clientBudget) * 100).toFixed(1) : 0}%</b></span>
                        </div>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <Card title="Cost Breakdown by Category">
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead><tr style={{ background: '#f5f5f5' }}>{['Category','Total','% of Direct Cost'].map(h=><th key={h} style={{ padding: '7px 10px', textAlign:'left', borderBottom:'2px solid #ddd' }}>{h}</th>)}</tr></thead>
                            <tbody>
                              {byCat.map(({ cat, total, pct }) => (
                                <tr key={cat} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: '7px 10px' }}><span style={{ background: CAT_BG[cat], color: CAT_COLOR[cat], padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{cat}</span></td>
                                  <td style={{ padding: '7px 10px', fontWeight: 600 }}>{money(total)}</td>
                                  <td style={{ padding: '7px 10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <div style={{ height: 8, width: `${Math.min(pct, 100)}%`, background: CAT_COLOR[cat], borderRadius: 4, minWidth: 4 }} />
                                      <span>{pct.toFixed(1)}%</span>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Card>
                        <Card title="Top Resources Across Project">
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                            <thead><tr style={{ background: '#f5f5f5' }}>{['Resource','Category','Total Cost','BOQ Items'].map(h=><th key={h} style={{ padding:'7px 10px', textAlign:'left', borderBottom:'2px solid #ddd' }}>{h}</th>)}</tr></thead>
                            <tbody>
                              {Array.from(byDesc.entries()).sort((a,b) => b[1].total - a[1].total).slice(0,15).map(([desc, val]) => (
                                <tr key={desc} style={{ borderBottom: '1px solid #eee' }}>
                                  <td style={{ padding: '7px 10px' }}>{desc}</td>
                                  <td style={{ padding: '7px 10px' }}><span style={{ background: CAT_BG[val.cat]??'#eee', color: CAT_COLOR[val.cat]??'#333', padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{val.cat}</span></td>
                                  <td style={{ padding: '7px 10px', fontWeight: 600 }}>{money(val.total)}</td>
                                  <td style={{ padding: '7px 10px', color: '#888' }}>{val.items}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Card>
                      </div>
                    </>
                  })()}
                </>
              })()}
            </>
          )}

          {activeView === 'schedule' && (() => {
            // ── helpers ──────────────────────────────────────────────────
            const total = scheduleActivities.length
            const notStarted = scheduleActivities.filter((a: any) => a.status === 'Not Started').length
            const inProgress = scheduleActivities.filter((a: any) => a.status === 'In Progress').length
            const completed = scheduleActivities.filter((a: any) => a.status === 'Completed').length
            const critical = scheduleActivities.filter((a: any) => (a.total_float ?? 999) === 0)
            const nearCritical = scheduleActivities.filter((a: any) => (a.total_float ?? 999) <= 5 && (a.total_float ?? 999) > 0)
            const overallPct = total > 0 ? scheduleActivities.reduce((s: number, a: any) => s + (a.schedule_pct ?? 0), 0) / total : 0

            // Project dates
            const allStarts = scheduleActivities.map((a: any) => a.planned_start).filter(Boolean).sort()
            const allFinishes = scheduleActivities.map((a: any) => a.planned_finish).filter(Boolean).sort()
            const projectStart = allStarts[0] ? new Date(allStarts[0]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
            const projectFinish = allFinishes[allFinishes.length - 1] ? new Date(allFinishes[allFinishes.length - 1]).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

            // Activity type groups from ID prefix
            const typeGroups = new Map<string, number>()
            scheduleActivities.forEach((a: any) => {
              const prefix = a.activity_id?.match(/^[A-Za-z]+/)?.[0] ?? 'Other'
              typeGroups.set(prefix, (typeGroups.get(prefix) ?? 0) + 1)
            })

            // Filtered list
            const filtered = scheduleFilter
              ? scheduleActivities.filter((a: any) =>
                  a.activity_name?.toLowerCase().includes(scheduleFilter.toLowerCase()) ||
                  a.activity_id?.toLowerCase().includes(scheduleFilter.toLowerCase()) ||
                  a.wbs_code?.toLowerCase().includes(scheduleFilter.toLowerCase())
                )
              : scheduleActivities

            const BAR = (pct: number, color: string, h = 8) => (
              <div style={{ height: h, background: '#e8e8e8', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 999 }} />
              </div>
            )

            const statusColor: Record<string, string> = {
              'Not Started': '#888',
              'In Progress': '#1565c0',
              'Completed': '#2e7d32',
              'Suspended': '#e65100',
            }

            return <>
              {/* Upload bar */}
              <div style={{ background: '#f8fffe', border: '1px solid #c8e6c9', borderRadius: 10, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1a6b4a' }}>📅 Primavera P6 Schedule Import</div>
                <label style={{ cursor: 'pointer' }}>
                  <span style={{ padding: '8px 18px', background: '#1a6b4a', color: '#fff', borderRadius: 7, fontSize: 13, fontWeight: 700 }}>⬆ Upload P6 Excel Export</span>
                  <input type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={async (e) => {
                    if (!projectId) return
                    const file = e.target.files?.[0]; if (!file) return
                    setScheduleUploadMsg('Parsing...')
                    try {
                      const XLSX = await import('xlsx')
                      const buf = await file.arrayBuffer()
                      const wb = XLSX.read(buf, { type: 'array', cellDates: true })
                      // Find TASK sheet
                      const sheetName = wb.SheetNames.find((n: string) => n.toUpperCase() === 'TASK') ?? wb.SheetNames[0]
                      const ws = wb.Sheets[sheetName]
                      const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
                      // P6 exports have 2 header rows:
                      // Row 0: internal codes (status_code, task_code, wbs_id...)
                      // Row 1: human labels (Activity Status, Activity ID, WBS Code...)
                      // We try row 1 first, then row 0 as fallback
                      let headerIdx = 1
                      // Check if row 1 has recognizable headers
                      if (raw.length > 1 && raw[1].some((c: any) => String(c).includes('Activity'))) {
                        headerIdx = 1
                      } else {
                        // fallback: find row with 'task_code' or 'Activity ID'
                        for (let i = 0; i < Math.min(raw.length, 5); i++) {
                          if (raw[i].some((c: any) => String(c).includes('Activity ID') || String(c) === 'task_code')) {
                            headerIdx = i; break
                          }
                        }
                      }
                      const headers: string[] = raw[headerIdx].map((c: any) => String(c))
                      // Also check row 0 for P6 internal codes as fallback mapping
                      const headers0: string[] = raw[0] ? raw[0].map((c: any) => String(c)) : []
                      const col = (name: string, fallback?: string) => {
                        let idx = headers.findIndex(h => h.includes(name))
                        if (idx === -1 && fallback) idx = headers0.findIndex(h => h === fallback)
                        return idx
                      }
                      const iStatus = col('Activity Status', 'status_code')
                      const iWbs = col('WBS Code', 'wbs_id')
                      const iId = col('Activity ID', 'task_code')
                      const iName = col('Activity Name', 'task_name')
                      const iOrigDur = col('Original Duration', 'target_drtn_hr_cnt')
                      const iRemDur = col('Remaining Duration', 'remain_drtn_hr_cnt')
                      const iPct = col('% Complete', 'sched_complete_pct')
                      const iStart = col('Start', 'start_date')
                      const iFinish = col('Finish', 'end_date')
                      const iActStart = col('Actual Start', 'act_start_date')
                      const iActFinish = col('Actual Finish', 'act_end_date')
                      const iFreeFloat = col('Free Float', 'free_float_hr_cnt')
                      const iTotalFloat = col('Total Float', 'total_float_hr_cnt')

                      const fmt = (v: any) => {
                        if (!v || v === '') return null
                        if (v instanceof Date) return v.toISOString().split('T')[0]
                        const d = new Date(v)
                        return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
                      }

                      // Skip both header rows — start after the last header row
                      const dataStart = Math.max(headerIdx + 1, 2)
                      const activities = raw.slice(dataStart)
                        .filter((r: any[]) => r[iId] && String(r[iId]).trim() && !String(r[iId]).includes('Activity ID') && !String(r[iId]).includes('task_code'))
                        .map((r: any[]) => ({
                          activity_id: String(r[iId]).trim(),
                          activity_name: String(r[iName] ?? '').trim(),
                          wbs_code: iWbs >= 0 ? String(r[iWbs] ?? '').trim() || null : null,
                          status: (String(r[iStatus] ?? 'Not Started').trim() || 'Not Started') as ActivityStatus,
                          original_duration: iOrigDur >= 0 ? parseFloat(r[iOrigDur]) || null : null,
                          remaining_duration: iRemDur >= 0 ? parseFloat(r[iRemDur]) || null : null,
                          schedule_pct: iPct >= 0 ? parseFloat(r[iPct]) || 0 : 0,
                          planned_start: fmt(r[iStart]),
                          planned_finish: fmt(r[iFinish]),
                          actual_start: iActStart >= 0 ? fmt(r[iActStart]) : null,
                          actual_finish: iActFinish >= 0 ? fmt(r[iActFinish]) : null,
                          free_float: iFreeFloat >= 0 ? parseFloat(r[iFreeFloat]) || 0 : 0,
                          total_float: iTotalFloat >= 0 ? parseFloat(r[iTotalFloat]) || 0 : 0,
                        }))

                      if (!activities.length) { setScheduleUploadMsg('❌ No activities found'); return }
                      const result = await bulkUpsertSchedule.mutateAsync({ projectId, activities })
                      setScheduleUploadMsg(`✅ ${result.upserted} activities imported successfully`)
                      e.target.value = ''
                    } catch (err) {
                      setScheduleUploadMsg('❌ Error: ' + String(err))
                    }
                  }} />
                </label>
                {scheduleUploadMsg && <span style={{ fontSize: 13, color: scheduleUploadMsg.startsWith('✅') ? '#2e7d32' : scheduleUploadMsg === 'Parsing...' ? '#1565c0' : '#c62828', fontWeight: 600 }}>{scheduleUploadMsg}</span>}
                {total > 0 && <span style={{ marginLeft: 'auto', fontSize: 13, color: '#666' }}>{total.toLocaleString()} activities loaded · {projectStart} → {projectFinish}</span>}
              </div>

              {total === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No Schedule Data</div>
                  <div style={{ fontSize: 14 }}>Upload your P6 Excel export above to get started</div>
                </div>
              ) : <>
                {/* Tabs */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                  {([['overview', '📊 Overview'], ['list', '📋 Activity List'], ['critical', '🔴 Critical Path']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setScheduleTab(id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: scheduleTab === id ? '#1a6b4a' : '#f0f0f0', color: scheduleTab === id ? '#fff' : '#333' }}>{label}</button>
                  ))}
                </div>

                {/* ── OVERVIEW TAB ── */}
                {scheduleTab === 'overview' && <>
                  {/* KPI strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 12, marginBottom: 20 }}>
                    {[
                      ['Total Activities', total.toLocaleString(), '#1a1a1a'],
                      ['Not Started', notStarted.toLocaleString(), '#888'],
                      ['In Progress', inProgress.toLocaleString(), '#1565c0'],
                      ['Completed', completed.toLocaleString(), '#2e7d32'],
                      ['Critical Path', critical.length.toLocaleString(), '#c62828'],
                      ['Overall Progress', overallPct.toFixed(1) + '%', '#1a6b4a'],
                    ].map(([l, v, c]) => (
                      <div key={l} style={{ background: '#fff', border: '1px solid #e8e8e8', borderLeft: `4px solid ${c}`, borderRadius: 10, padding: '12px 16px' }}>
                        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{l}</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20, marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontWeight: 700 }}>Overall Schedule Progress</span>
                      <span style={{ fontWeight: 800, color: '#1a6b4a', fontSize: 18 }}>{overallPct.toFixed(1)}%</span>
                    </div>
                    {BAR(overallPct, '#1a6b4a', 16)}
                    <div style={{ display: 'flex', gap: 24, marginTop: 12, fontSize: 13, color: '#666' }}>
                      <span>🟢 Completed: {completed}</span>
                      <span>🔵 In Progress: {inProgress}</span>
                      <span>⚪ Not Started: {notStarted}</span>
                      <span>🔴 Critical: {critical.length}</span>
                      {nearCritical.length > 0 && <span style={{ color: '#e65100' }}>⚠️ Near-Critical: {nearCritical.length}</span>}
                    </div>
                  </div>

                  {/* Activity types + Date milestones */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Activity Types</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead><tr style={{ background: '#f5f5f5' }}>
                          {['Type Code', 'Count', 'Share'].map(h => <th key={h} style={{ padding: '7px 10px', textAlign: 'left', borderBottom: '2px solid #eee' }}>{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {Array.from(typeGroups.entries()).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                            <tr key={type} style={{ borderBottom: '1px solid #f5f5f5' }}>
                              <td style={{ padding: '7px 10px', fontWeight: 700 }}>{type}</td>
                              <td style={{ padding: '7px 10px' }}>{count}</td>
                              <td style={{ padding: '7px 10px', minWidth: 120 }}>
                                {BAR(total > 0 ? (count / total) * 100 : 0, '#1565c0', 6)}
                                <span style={{ fontSize: 11, color: '#888' }}>{total > 0 ? ((count / total) * 100).toFixed(1) : 0}%</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', padding: 20 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Schedule Milestones</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[
                          ['Project Start', projectStart, '#1565c0'],
                          ['Project Finish', projectFinish, '#c62828'],
                          ['Total Duration', allStarts[0] && allFinishes[allFinishes.length-1] ? (() => {
                            const s = new Date(allStarts[0]), f = new Date(allFinishes[allFinishes.length-1])
                            const days = Math.ceil((f.getTime() - s.getTime()) / (1000*60*60*24))
                            return `${days} days (${(days/30).toFixed(0)} months)`
                          })() : '—', '#1a6b4a'],
                          ['Critical Activities', `${critical.length} (${total > 0 ? ((critical.length/total)*100).toFixed(1) : 0}% of total)`, '#c62828'],
                          ['Float = 0 activities', `${critical.length} activities on critical path`, '#c62828'],
                        ].map(([l, v, c]) => (
                          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#f8f8f8', borderRadius: 8, borderLeft: `3px solid ${c}` }}>
                            <span style={{ fontSize: 13, color: '#666' }}>{l}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>}

                {/* ── ACTIVITY LIST TAB ── */}
                {scheduleTab === 'list' && <>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                    <input
                      value={scheduleFilter}
                      onChange={e => setScheduleFilter(e.target.value)}
                      placeholder="🔍 Search by activity ID, name, or WBS..."
                      style={{ flex: 1, padding: '9px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, fontFamily: 'inherit' }}
                    />
                    <span style={{ fontSize: 13, color: '#888', whiteSpace: 'nowrap' }}>{filtered.length.toLocaleString()} activities</span>
                  </div>
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#1a6b4a', color: '#fff' }}>
                          {['Activity ID', 'Activity Name', 'WBS', 'Status', 'Orig.Dur', 'Rem.Dur', '% Complete', 'Planned Start', 'Planned Finish', 'Total Float'].map(h => (
                            <th key={h} style={{ padding: '10px 10px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.slice(0, 200).map((a: any) => {
                          const isCritical = (a.total_float ?? 999) === 0
                          const isNearCrit = (a.total_float ?? 999) <= 5 && (a.total_float ?? 999) > 0
                          return (
                            <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0', background: isCritical ? '#fff5f5' : isNearCrit ? '#fffbf0' : 'white' }}>
                              <td style={{ padding: '7px 10px', fontWeight: 700, color: isCritical ? '#c62828' : '#333', whiteSpace: 'nowrap' }}>{a.activity_id}</td>
                              <td style={{ padding: '7px 10px', maxWidth: 280 }}>{a.activity_name}</td>
                              <td style={{ padding: '7px 10px', color: '#888', fontSize: 11 }}>{a.wbs_code?.split('.').slice(-2).join('.') ?? '—'}</td>
                              <td style={{ padding: '7px 10px' }}>
                                <span style={{ background: (statusColor[a.status] ?? '#888') + '22', color: statusColor[a.status] ?? '#888', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{a.status}</span>
                              </td>
                              <td style={{ padding: '7px 10px', textAlign: 'right' }}>{a.original_duration ?? '—'}</td>
                              <td style={{ padding: '7px 10px', textAlign: 'right' }}>{a.remaining_duration ?? '—'}</td>
                              <td style={{ padding: '7px 10px', minWidth: 100 }}>
                                {BAR(a.schedule_pct ?? 0, '#1a6b4a', 6)}
                                <span style={{ fontSize: 11, color: '#888' }}>{a.schedule_pct ?? 0}%</span>
                              </td>
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', color: '#555' }}>{a.planned_start ? new Date(a.planned_start).toLocaleDateString('en-GB') : '—'}</td>
                              <td style={{ padding: '7px 10px', whiteSpace: 'nowrap', color: '#555' }}>{a.planned_finish ? new Date(a.planned_finish).toLocaleDateString('en-GB') : '—'}</td>
                              <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 700, color: isCritical ? '#c62828' : isNearCrit ? '#e65100' : '#2e7d32' }}>{a.total_float ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filtered.length > 200 && (
                      <div style={{ padding: '12px 16px', background: '#f8f8f8', fontSize: 13, color: '#888', textAlign: 'center' }}>
                        Showing 200 of {filtered.length.toLocaleString()} activities. Use search to filter.
                      </div>
                    )}
                  </div>
                </>}

                {/* ── CRITICAL PATH TAB ── */}
                {scheduleTab === 'critical' && <>
                  <div style={{ background: '#ffebee', border: '1px solid #ef9a9a', borderRadius: 10, padding: '14px 20px', marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, color: '#c62828', marginBottom: 6 }}>🔴 Critical Path — {critical.length} Activities (Total Float = 0)</div>
                    <div style={{ fontSize: 13, color: '#666' }}>These activities have zero float. Any delay will directly delay the project completion date.</div>
                  </div>
                  {nearCritical.length > 0 && (
                    <div style={{ background: '#fff8e1', border: '1px solid #ffcc80', borderRadius: 10, padding: '14px 20px', marginBottom: 20 }}>
                      <div style={{ fontWeight: 700, color: '#e65100', marginBottom: 6 }}>⚠️ Near-Critical — {nearCritical.length} Activities (Float ≤ 5 days)</div>
                      <div style={{ fontSize: 13, color: '#666' }}>These activities are at risk of becoming critical. Monitor closely.</div>
                    </div>
                  )}
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#c62828', color: '#fff' }}>
                          {['Activity ID', 'Activity Name', 'Duration', 'Planned Start', 'Planned Finish', 'Float', 'Risk'].map(h => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[...critical, ...nearCritical].sort((a: any, b: any) => (a.planned_start ?? '').localeCompare(b.planned_start ?? '')).map((a: any) => {
                          const isCrit = (a.total_float ?? 999) === 0
                          return (
                            <tr key={a.id} style={{ borderBottom: '1px solid #f0f0f0', background: isCrit ? '#fff5f5' : '#fffbf0' }}>
                              <td style={{ padding: '9px 12px', fontWeight: 700, color: isCrit ? '#c62828' : '#e65100' }}>{a.activity_id}</td>
                              <td style={{ padding: '9px 12px' }}>{a.activity_name}</td>
                              <td style={{ padding: '9px 12px', textAlign: 'right' }}>{a.original_duration}d</td>
                              <td style={{ padding: '9px 12px' }}>{a.planned_start ? new Date(a.planned_start).toLocaleDateString('en-GB') : '—'}</td>
                              <td style={{ padding: '9px 12px' }}>{a.planned_finish ? new Date(a.planned_finish).toLocaleDateString('en-GB') : '—'}</td>
                              <td style={{ padding: '9px 12px', fontWeight: 800, color: isCrit ? '#c62828' : '#e65100', textAlign: 'center' }}>{a.total_float}</td>
                              <td style={{ padding: '9px 12px' }}>
                                <span style={{ background: isCrit ? '#ffebee' : '#fff8e1', color: isCrit ? '#c62828' : '#e65100', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{isCrit ? '🔴 Critical' : '⚠️ Near-Critical'}</span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>}
              </>}
            </>
          })()}

          {activeView === 'villas' && (() => {
            if (!projectId) return <Card title="Villa Tracker"><div>Select a project first.</div></Card>

            // ── helpers ──────────────────────────────────────────────
            const phases = structures.filter(s => s.type === 'Phase')
            const villaTypes = structures.filter(s => s.type === 'Villa' || s.type === 'Building')
            
            const progressFor = (unitId: string, trade: TradeType) =>
              villaProgress.find((p: any) => p.villa_unit_id === unitId && p.trade === trade)?.completion_pct ?? 0

            const overallPct = (unitId: string) => {
              const tradeScores = TRADES.map(t => progressFor(unitId, t))
              const active = tradeScores.filter(p => p > 0)
              if (!active.length) return 0
              return Math.round(tradeScores.reduce((a, b) => a + b, 0) / TRADES.length)
            }

            const villaTypeStats = (typeId: string) => {
              const units = villaUnits.filter((u: any) => u.villa_type_id === typeId)
              const completed = units.filter((u: any) => u.status === 'Completed').length
              const inProgress = units.filter((u: any) => u.status === 'In Progress').length
              const avgPct = units.length > 0 ? Math.round(units.reduce((s: number, u: any) => s + overallPct(u.id), 0) / units.length) : 0
              return { total: units.length, completed, inProgress, avgPct }
            }

            // Filtered units for tracker
            const filteredUnits = villaUnits.filter((u: any) => {
              if (villaFilterPhase && u.phase_id !== villaFilterPhase) return false
              if (villaFilterType && u.villa_type_id !== villaFilterType) return false
              if (villaFilterSub && u.subcontractor_id !== villaFilterSub) return false
              return true
            })

            const BAR = (pct: number, color: string, h = 6) => (
              <div style={{ height: h, background: '#e8e8e8', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 999 }} />
              </div>
            )

            const statusColor: Record<string, string> = {
              'Not Started': '#888', 'In Progress': '#1565c0', 'Completed': '#2e7d32', 'On Hold': '#e65100'
            }
            const tradeColor: Record<string, string> = {
              Structural: '#1565c0', MEP: '#6a1b9a', Finishing: '#e65100', 'External Works': '#2e7d32', Landscaping: '#1a6b4a', Other: '#888'
            }

            // BOQ stats per type
            const boqForType = (typeId: string) => boqItems.filter(b => b.structure_id === typeId)
            const boqValueForType = (typeId: string) => boqForType(typeId).reduce((s, b) => s + (b.boq_qty ?? 0) * ((b as any).client_rate ?? (b as any).rate ?? 0), 0)

            return <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
                {([['overview','🏘️ Overview'], ['generate','⚙️ Generate Villas'], ['tracker','📋 Villa Tracker'], ['progress','📊 Progress Update']] as const).map(([id, label]) => (
                  <button key={id} onClick={() => setVillaTab(id)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: villaTab === id ? '#1a6b4a' : '#f0f0f0', color: villaTab === id ? '#fff' : '#333' }}>{label}</button>
                ))}
                <div style={{ marginLeft: 'auto', fontSize: 13, color: '#666', alignSelf: 'center' }}>
                  {villaUnits.length} villas · {villaUnits.filter((u: any) => u.status === 'Completed').length} completed · {villaUnits.filter((u: any) => u.status === 'In Progress').length} in progress
                </div>
              </div>

              {/* ── OVERVIEW TAB ── */}
              {villaTab === 'overview' && <>
                {/* KPI strip */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 20 }}>
                  {[
                    ['Total Villas', villaUnits.length, '#1a1a1a'],
                    ['Not Started', villaUnits.filter((u: any) => u.status === 'Not Started').length, '#888'],
                    ['In Progress', villaUnits.filter((u: any) => u.status === 'In Progress').length, '#1565c0'],
                    ['Completed', villaUnits.filter((u: any) => u.status === 'Completed').length, '#2e7d32'],
                    ['On Hold', villaUnits.filter((u: any) => u.status === 'On Hold').length, '#e65100'],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ background: '#fff', border: '1px solid #e8e8e8', borderLeft: `4px solid ${c}`, borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{l}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: c }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Per villa type summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
                  {villaTypes.map(vt => {
                    const stats = villaTypeStats(vt.id)
                    const boqVal = boqValueForType(vt.id)
                    const boqCount = boqForType(vt.id).length
                    if (stats.total === 0 && boqCount === 0) return null
                    return (
                      <div key={vt.id} style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                        <div style={{ background: '#1a6b4a', color: '#fff', padding: '12px 16px', display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 15 }}>{vt.type} — {vt.code}</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>{vt.name}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 700, fontSize: 16 }}>{stats.total} villas</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>{boqCount} BOQ items</div>
                          </div>
                        </div>
                        <div style={{ padding: 16 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                            <span>Overall Progress</span>
                            <span style={{ fontWeight: 700, color: '#1a6b4a' }}>{stats.avgPct}%</span>
                          </div>
                          {BAR(stats.avgPct, '#1a6b4a', 10)}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                            <div style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: 6, padding: '6px 0' }}>
                              <div style={{ fontWeight: 700, color: '#2e7d32' }}>{stats.completed}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>Done</div>
                            </div>
                            <div style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: 6, padding: '6px 0' }}>
                              <div style={{ fontWeight: 700, color: '#1565c0' }}>{stats.inProgress}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>Active</div>
                            </div>
                            <div style={{ textAlign: 'center', background: '#f5f5f5', borderRadius: 6, padding: '6px 0' }}>
                              <div style={{ fontWeight: 700 }}>{money(boqVal)}</div>
                              <div style={{ fontSize: 11, color: '#888' }}>BOQ Value</div>
                            </div>
                          </div>
                          {/* Per trade progress */}
                          <div style={{ marginTop: 12 }}>
                            {TRADES.map(trade => {
                              const units = villaUnits.filter((u: any) => u.villa_type_id === vt.id)
                              const avg = units.length > 0 ? Math.round(units.reduce((s: number, u: any) => s + progressFor(u.id, trade), 0) / units.length) : 0
                              if (avg === 0) return null
                              return (
                                <div key={trade} style={{ marginBottom: 6 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                                    <span style={{ color: tradeColor[trade] }}>{trade}</span>
                                    <span>{avg}%</span>
                                  </div>
                                  {BAR(avg, tradeColor[trade], 5)}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  {villaTypes.length === 0 && <div style={{ color: '#888', padding: 20 }}>No villa types found. Add villa types in Project Structure first.</div>}
                </div>
              </>}

              {/* ── GENERATE VILLAS TAB ── */}
              {villaTab === 'generate' && (
                <Card title="Generate Villa Units">
                  <div style={{ marginBottom: 16, padding: '10px 16px', background: '#e3f2fd', borderRadius: 8, fontSize: 13, color: '#1565c0' }}>
                    ℹ️ Generate villa unit numbers in bulk. Each villa gets a unique number. You can assign a subcontractor now or later.
                  </div>
                  <FormGrid>
                    <Field label="Phase">
                      <Select value={villaGenForm.phase_id} onChange={e => setVillaGenForm({ ...villaGenForm, phase_id: e.target.value })}>
                        <option value="">Select Phase</option>
                        {phases.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="Villa Type">
                      <Select value={villaGenForm.villa_type_id} onChange={e => {
                        const vt = villaTypes.find(v => v.id === e.target.value)
                        setVillaGenForm({ ...villaGenForm, villa_type_id: e.target.value, prefix: vt?.code ?? '' })
                      }}>
                        <option value="">Select Villa Type</option>
                        {villaTypes.map(v => <option key={v.id} value={v.id}>{v.code} — {v.name}</option>)}
                      </Select>
                    </Field>
                    <Field label="Number of Villas">
                      <Input type="number" value={villaGenForm.count} onChange={e => setVillaGenForm({ ...villaGenForm, count: e.target.value })} min="1" max="200" />
                    </Field>
                    <Field label="Villa Number Prefix (e.g. V1-, B2-)">
                      <Input value={villaGenForm.prefix} onChange={e => setVillaGenForm({ ...villaGenForm, prefix: e.target.value })} placeholder="e.g. V1-" />
                    </Field>
                    <Field label="Default Subcontractor (optional)">
                      <Select value={villaGenForm.subcontractor_id} onChange={e => setVillaGenForm({ ...villaGenForm, subcontractor_id: e.target.value })}>
                        <option value="">Assign later</option>
                        {subcontractors.map(s => <option key={s.id} value={s.id}>{s.subcontractor_code} — {s.name}</option>)}
                      </Select>
                    </Field>
                  </FormGrid>
                  {villaGenForm.villa_type_id && villaGenForm.phase_id && parseInt(villaGenForm.count) > 0 && (
                    <div style={{ margin: '12px 0', padding: '10px 16px', background: '#f0f7f4', borderRadius: 8, fontSize: 13 }}>
                      Will generate: <strong>{villaGenForm.prefix || 'V'}-001</strong> to <strong>{villaGenForm.prefix || 'V'}-{String(parseInt(villaGenForm.count)).padStart(3,'0')}</strong>
                    </div>
                  )}
                  <Toolbar>
                    <Button
                      onClick={async () => {
                        if (!villaGenForm.phase_id || !villaGenForm.villa_type_id || !parseInt(villaGenForm.count)) return
                        const count = parseInt(villaGenForm.count)
                        // Find existing villas for this type to continue numbering
                        const existing = villaUnits.filter((u: any) => u.villa_type_id === villaGenForm.villa_type_id && u.phase_id === villaGenForm.phase_id).length
                        const units = Array.from({ length: count }, (_, i) => ({
                          phase_id: villaGenForm.phase_id,
                          villa_type_id: villaGenForm.villa_type_id,
                          villa_no: `${villaGenForm.prefix || 'V'}-${String(existing + i + 1).padStart(3, '0')}`,
                          subcontractor_id: villaGenForm.subcontractor_id || null,
                          status: 'Not Started' as const,
                        }))
                        await run('Generate villas', () => bulkCreateVillaUnits.mutateAsync({ projectId: projectId!, units }))
                        setVillaGenForm({ ...villaGenForm, count: '10' })
                      }}
                      disabled={bulkCreateVillaUnits.isPending || !villaGenForm.phase_id || !villaGenForm.villa_type_id}
                    >
                      {bulkCreateVillaUnits.isPending ? 'Generating...' : `Generate ${villaGenForm.count} Villas`}
                    </Button>
                  </Toolbar>
                </Card>
              )}

              {/* ── TRACKER TAB ── */}
              {villaTab === 'tracker' && <>
                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <Select value={villaFilterPhase} onChange={e => setVillaFilterPhase(e.target.value)} style={{ minWidth: 160 }}>
                    <option value="">All Phases</option>
                    {phases.map(p => <option key={p.id} value={p.id}>{p.code} — {p.name}</option>)}
                  </Select>
                  <Select value={villaFilterType} onChange={e => setVillaFilterType(e.target.value)} style={{ minWidth: 160 }}>
                    <option value="">All Types</option>
                    {villaTypes.map(v => <option key={v.id} value={v.id}>{v.code} — {v.name}</option>)}
                  </Select>
                  <Select value={villaFilterSub} onChange={e => setVillaFilterSub(e.target.value)} style={{ minWidth: 180 }}>
                    <option value="">All Subcontractors</option>
                    {subcontractors.map(s => <option key={s.id} value={s.id}>{s.subcontractor_code} — {s.name}</option>)}
                  </Select>
                  <span style={{ fontSize: 13, color: '#888', alignSelf: 'center' }}>{filteredUnits.length} villas</span>
                </div>

                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#1a6b4a', color: '#fff' }}>
                        {['Villa No', 'Phase', 'Type', 'Subcontractor', 'Status', 'Overall %', ...TRADES, 'Actions'].map(h => (
                          <th key={h} style={{ padding: '9px 10px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUnits.length === 0 && (
                        <tr><td colSpan={10 + TRADES.length} style={{ padding: 24, textAlign: 'center', color: '#888' }}>No villas found. Generate villas in the Generate tab.</td></tr>
                      )}
                      {filteredUnits.map((u: any) => {
                        const phase = structures.find(s => s.id === u.phase_id)
                        const vtype = structures.find(s => s.id === u.villa_type_id)
                        const sub = subcontractors.find(s => s.id === u.subcontractor_id)
                        const overall = overallPct(u.id)
                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '7px 10px', fontWeight: 700 }}>{u.villa_no}</td>
                            <td style={{ padding: '7px 10px', color: '#666' }}>{phase?.code ?? '—'}</td>
                            <td style={{ padding: '7px 10px' }}>{vtype?.code ?? '—'}</td>
                            <td style={{ padding: '7px 10px', fontSize: 11 }}>{sub?.subcontractor_code ?? <span style={{ color: '#e65100' }}>Unassigned</span>}</td>
                            <td style={{ padding: '7px 10px' }}>
                              <select value={u.status} onChange={async e => {
                                await run('Update status', () => updateVillaUnit.mutateAsync({ id: u.id, data: { status: e.target.value as any } }))
                              }} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 6, border: '1px solid #ddd', color: statusColor[u.status] ?? '#333', fontWeight: 600, cursor: 'pointer' }}>
                                {['Not Started','In Progress','Completed','On Hold'].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </td>
                            <td style={{ padding: '7px 10px', minWidth: 80 }}>
                              {BAR(overall, overall >= 80 ? '#2e7d32' : overall >= 40 ? '#f9a825' : '#1565c0', 6)}
                              <span style={{ fontSize: 11, color: '#666' }}>{overall}%</span>
                            </td>
                            {TRADES.map(trade => {
                              const pct = progressFor(u.id, trade)
                              return (
                                <td key={trade} style={{ padding: '4px 6px', minWidth: 60 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ flex: 1 }}>{BAR(pct, tradeColor[trade], 4)}</div>
                                    <span style={{ fontSize: 10, color: '#888', minWidth: 24 }}>{pct}%</span>
                                  </div>
                                </td>
                              )
                            })}
                            <td style={{ padding: '7px 10px' }}>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button onClick={() => { setSelectedVillaUnit(u.id); setVillaTab('progress'); const init: Record<string, string> = {}; TRADES.forEach(t => { init[t] = String(progressFor(u.id, t)) }); setProgressForm(init) }} style={{ padding: '3px 8px', background: '#e3f2fd', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 11, color: '#1565c0', fontWeight: 600 }}>Update</button>
                                <button onClick={() => run('Delete', () => deleteVillaUnit.mutateAsync({ id: u.id, projectId: projectId! }))} style={{ padding: '3px 6px', background: 'none', border: 'none', cursor: 'pointer', color: '#c62828', fontSize: 14 }}>✕</button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>}

              {/* ── PROGRESS UPDATE TAB ── */}
              {villaTab === 'progress' && (
                <Card title="Update Villa Progress by Trade">
                  <div style={{ marginBottom: 16 }}>
                    <Field label="Select Villa">
                      <Select value={selectedVillaUnit} onChange={e => {
                        setSelectedVillaUnit(e.target.value)
                        const init: Record<string, string> = {}
                        TRADES.forEach(t => { init[t] = String(progressFor(e.target.value, t)) })
                        setProgressForm(init)
                      }}>
                        <option value="">— Select Villa —</option>
                        {villaUnits.map((u: any) => {
                          const vtype = structures.find(s => s.id === u.villa_type_id)
                          const phase = structures.find(s => s.id === u.phase_id)
                          return <option key={u.id} value={u.id}>{u.villa_no} — {vtype?.code} — {phase?.code}</option>
                        })}
                      </Select>
                    </Field>
                  </div>

                  {selectedVillaUnit && (() => {
                    const unit = villaUnits.find((u: any) => u.id === selectedVillaUnit) as any
                    const vtype = structures.find(s => s.id === unit?.villa_type_id)
                    const boqItems4Type = boqForType(unit?.villa_type_id ?? '')
                    const boqByDiscipline = new Map<string, typeof boqItems4Type>()
                    boqItems4Type.forEach(b => {
                      const disc = b.discipline ?? 'Other'
                      boqByDiscipline.set(disc, [...(boqByDiscipline.get(disc) ?? []), b])
                    })

                    return (
                      <div>
                        <div style={{ background: '#1a6b4a', color: '#fff', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 16 }}>{unit?.villa_no}</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>Type: {vtype?.code} — {vtype?.name} · {boqItems4Type.length} BOQ items</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 22, fontWeight: 800 }}>{overallPct(selectedVillaUnit)}%</div>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>Overall Progress</div>
                          </div>
                        </div>

                        {/* Trade progress sliders */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20, marginBottom: 20 }}>
                          {TRADES.map(trade => {
                            const val = parseInt(progressForm[trade] ?? '0') || 0
                            // Find relevant BOQ items for this trade
                            const relatedBoq = boqItems4Type.filter(b => {
                              const d = b.discipline ?? ''
                              if (trade === 'Structural') return ['Structural','Civil'].includes(d)
                              if (trade === 'MEP') return ['MEP','Electrical','Plumbing','HVAC'].includes(d)
                              if (trade === 'Finishing') return ['Architectural','Finishing','Fit-Out','Facade'].includes(d)
                              if (trade === 'External Works') return ['Infrastructure','External'].includes(d)
                              if (trade === 'Landscaping') return d === 'Landscaping'
                              return true
                            })
                            return (
                              <div key={trade} style={{ background: '#f8f8f8', borderRadius: 10, padding: 16, borderLeft: `4px solid ${tradeColor[trade]}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                  <span style={{ fontWeight: 700, color: tradeColor[trade] }}>{trade}</span>
                                  <span style={{ fontWeight: 800, fontSize: 18, color: tradeColor[trade] }}>{val}%</span>
                                </div>
                                <input
                                  type="range"
                                  min="0" max="100" step="5"
                                  value={val}
                                  onChange={e => setProgressForm({ ...progressForm, [trade]: e.target.value })}
                                  style={{ width: '100%', accentColor: tradeColor[trade], marginBottom: 8 }}
                                />
                                {BAR(val, tradeColor[trade], 8)}
                                {relatedBoq.length > 0 && (
                                  <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
                                    Related BOQ: {relatedBoq.slice(0,3).map(b => b.item_code).join(', ')}{relatedBoq.length > 3 ? ` +${relatedBoq.length-3} more` : ''}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>

                        <div style={{ background: '#f0f7f4', borderRadius: 10, padding: '12px 18px', marginBottom: 16, display: 'flex', gap: 24, fontSize: 14 }}>
                          <span>New Overall Progress: <strong style={{ color: '#1a6b4a', fontSize: 18 }}>{Math.round(TRADES.reduce((s, t) => s + (parseInt(progressForm[t] ?? '0') || 0), 0) / TRADES.length)}%</strong></span>
                        </div>

                        <Button
                          onClick={async () => {
                            await run('Save progress', async () => {
                              for (const trade of TRADES) {
                                const pct = parseInt(progressForm[trade] ?? '0') || 0
                                if (pct > 0 || progressFor(selectedVillaUnit, trade as TradeType) > 0) {
                                  await upsertVillaProgress.mutateAsync({
                                    project_id: projectId!,
                                    villa_unit_id: selectedVillaUnit,
                                    trade: trade as TradeType,
                                    completion_pct: pct,
                                    notes: null,
                                    updated_by: user?.id ?? null,
                                    updated_at: new Date().toISOString(),
                                  })
                                }
                              }
                              // Auto-update villa status
                              const overall = Math.round(TRADES.reduce((s, t) => s + (parseInt(progressForm[t] ?? '0') || 0), 0) / TRADES.length)
                              const newStatus = overall === 100 ? 'Completed' : overall > 0 ? 'In Progress' : 'Not Started'
                              await updateVillaUnit.mutateAsync({ id: selectedVillaUnit, data: { status: newStatus as any } })
                            })
                          }}
                          disabled={upsertVillaProgress.isPending}
                        >
                          💾 Save Progress
                        </Button>
                      </div>
                    )
                  })()}
                </Card>
              )}
            </>
          })()}
        </div>
      </main>
    </div>
  )
}
