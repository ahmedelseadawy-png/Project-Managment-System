// supabase/functions/generate-certificate/index.ts
import { createClient } from '@supabase/supabase-js'
import { corsResponse, errorResponse, jsonResponse } from '../_shared/cors.ts'
import { calculateCertificate } from '../_shared/engine.ts'
import type { GenerateCertificateRequest, GenerateCertificateResponse, DbBreakdown, DbQsEntry, DbPriorHistory, DbSubcontractor } from '../_shared/types.ts'

function validateRequest(b: Partial<GenerateCertificateRequest>): string[] {
  const e: string[] = []
  if (!b.project_id)       e.push('project_id is required')
  if (!b.subcontractor_id) e.push('subcontractor_id is required')
  if (!b.cert_no || b.cert_no < 1) e.push('cert_no must be a positive integer')
  if (!b.period_end) e.push('period_end is required')
  else if (isNaN(Date.parse(b.period_end))) e.push('period_end must be a valid ISO date')
  if (b.retention_pct !== undefined && (b.retention_pct < 0 || b.retention_pct > 1)) e.push('retention_pct must be 0–1')
  return e
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return corsResponse()
  if (req.method !== 'POST')    return errorResponse('Method not allowed', 405)

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return errorResponse('Missing Authorization header', 401)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authHeader } } })
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return errorResponse('Unauthorized', 401)

  let body: GenerateCertificateRequest
  try { body = await req.json() } catch { return errorResponse('Invalid JSON body') }

  const ve = validateRequest(body)
  if (ve.length > 0) return errorResponse('Validation failed', 400, ve)

  const { project_id, subcontractor_id, cert_no, period_end, dry_run = false } = body

  // Fetch subcontractor
  const { data: sub, error: subErr } = await supabase.from('subcontractors').select('id,subcontractor_code,name,default_retention_pct').eq('id', subcontractor_id).single()
  if (subErr || !sub) return errorResponse(`Subcontractor not found: ${subErr?.message}`, 404)

  // Check uniqueness
  const { data: existingCert } = await supabase.from('certificates').select('id,status').eq('project_id', project_id).eq('subcontractor_id', subcontractor_id).eq('cert_no', cert_no).maybeSingle()
  if (existingCert && !dry_run) return errorResponse(`Certificate #${cert_no} already exists (status: ${existingCert.status})`, 409)

  // Fetch breakdowns
  const { data: bdRows, error: bdErr } = await supabase.from('subcontract_breakdown').select('id,assignment_key,structure_id,project_model,// auto qty from BOQ,rate,boq_items(item_code,description,unit)').eq('project_id', project_id).eq('subcontractor_id', subcontractor_id).eq('is_active', true).order('assignment_key')
  if (bdErr) return errorResponse(`Failed to fetch breakdown: ${bdErr.message}`, 500)
  if (!bdRows || bdRows.length === 0) return errorResponse('No active breakdown lines found', 422)

  // Fetch approved QS entries
  const { data: qsRows, error: qsErr } = await supabase.from('qs_entries').select('id,breakdown_id,assignment_key,boq_qty,actual_survey_qty,effective_pay_qty,cert_no,period_end,status,subcontract_breakdown!inner(subcontractor_id)').eq('project_id', project_id).eq('subcontract_breakdown.subcontractor_id', subcontractor_id).eq('cert_no', cert_no).eq('status', 'Approved')
  if (qsErr) return errorResponse(`Failed to fetch QS entries: ${qsErr.message}`, 500)

  // Fetch prior history
  const { data: histRows, error: histErr } = await supabase.from('certificate_lines').select('assignment_key,current_qty,current_value,certificates!inner(project_id,subcontractor_id,cert_no,status)').eq('certificates.project_id', project_id).eq('certificates.subcontractor_id', subcontractor_id).lt('certificates.cert_no', cert_no).in('certificates.status', ['Approved','Paid'])
  if (histErr) return errorResponse(`Failed to fetch history: ${histErr.message}`, 500)

  // Aggregate history
  const histAgg = new Map<string, { total_prev_qty: number; total_prev_value: number }>()
  for (const row of (histRows ?? [])) {
    const cur = histAgg.get(row.assignment_key) ?? { total_prev_qty: 0, total_prev_value: 0 }
    histAgg.set(row.assignment_key, { total_prev_qty: cur.total_prev_qty + (row.current_qty ?? 0), total_prev_value: cur.total_prev_value + (row.current_value ?? 0) })
  }
  const priorHistory: DbPriorHistory[] = Array.from(histAgg.entries()).map(([k, v]) => ({ assignment_key: k, ...v }))

  const { lines, summary, errors } = calculateCertificate(body, bdRows as DbBreakdown[], (qsRows ?? []) as DbQsEntry[], priorHistory, (sub as DbSubcontractor).default_retention_pct)

  const base = { project_id, subcontractor_id, subcontractor_code: (sub as DbSubcontractor).subcontractor_code, subcontractor_name: (sub as DbSubcontractor).name, ...summary }

  if (errors.length > 0) return jsonResponse({ ...base, certificate_id: null, saved: false } as GenerateCertificateResponse, 422)
  if (dry_run)           return jsonResponse({ ...base, certificate_id: null, saved: false } as GenerateCertificateResponse)

  // Insert header
  const { data: certRow, error: certErr } = await supabase.from('certificates').insert({ project_id, subcontractor_id, cert_no, period_end, gross_amount: summary.gross_amount, retention_pct: summary.retention_pct, retention_amount: summary.retention_amount, advance_recovery: summary.advance_recovery, deductions: summary.deductions, penalties: summary.penalties, other_additions: summary.other_additions, previously_paid: summary.previously_paid, net_payable: summary.net_payable, status: 'Draft', notes: body.notes ?? null }).select('id').single()
  if (certErr || !certRow) {
    if (certErr?.code === '23505') return errorResponse(`Certificate #${cert_no} was just created by another request`, 409)
    return errorResponse(`Failed to create certificate: ${certErr?.message}`, 500)
  }

  // Insert lines
  const { error: linesErr } = await supabase.from('certificate_lines').insert(lines.map(l => ({ certificate_id: certRow.id, project_id, breakdown_id: l.breakdown_id, qs_entry_id: l.qs_entry_id, line_no: l.line_no, assignment_key: l.assignment_key, contract_qty: l.contract_qty, actual_survey_qty: l.actual_survey_qty, effective_pay_qty: l.effective_pay_qty, previous_qty: l.previous_qty, current_qty: l.current_qty, rate: l.rate, warning: l.warning })))
  if (linesErr) {
    await supabase.from('certificates').delete().eq('id', certRow.id)
    return errorResponse(`Failed to insert lines: ${linesErr.message}`, 500)
  }

  return jsonResponse({ ...base, certificate_id: certRow.id, saved: true } as GenerateCertificateResponse)
})
