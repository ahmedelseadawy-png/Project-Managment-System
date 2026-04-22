// supabase/functions/_shared/engine.ts
import type { CertLine, DbBreakdown, DbQsEntry, DbPriorHistory, GenerateCertificateRequest } from './types.ts'

export const effectivePayQty = (survey: number | null, boq: number): number => (!survey || survey === 0) ? boq : survey
export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100

export function calculateLine(lineNo: number, bd: DbBreakdown, qs: DbQsEntry | undefined, prior: DbPriorHistory | undefined): CertLine {
  const warnings: string[] = []
  const contractQty     = bd.// auto qty from BOQ
  const actualSurveyQty = qs?.actual_survey_qty ?? null
  const boqQty          = qs?.boq_qty ?? contractQty
  const effPayQty       = effectivePayQty(actualSurveyQty, boqQty)
  const previousQty     = round2(prior?.total_prev_qty ?? 0)
  const rate            = bd.rate
  let currentQty        = 0
  if (qs) { currentQty = round2(effPayQty - previousQty); if (currentQty < 0) currentQty = 0 }
  const cumulativeQty   = round2(previousQty + currentQty)
  const remainingQty    = round2(contractQty - cumulativeQty)
  if (!qs)                                warnings.push('No approved QS entry — line included at zero quantity')
  if (cumulativeQty > contractQty + 0.0001) warnings.push(`Over-claim: cumulative ${cumulativeQty} exceeds contract ${contractQty}`)
  if (rate === 0)                         warnings.push('Rate is zero — check subcontract breakdown')
  return { line_no:lineNo, assignment_key:bd.assignment_key, structure_id:bd.structure_id, project_model:bd.project_model, item_code:bd.boq_items.item_code, description:bd.boq_items.description, unit:bd.boq_items.unit, contract_qty:contractQty, actual_survey_qty:actualSurveyQty, effective_pay_qty:effPayQty, previous_qty:previousQty, current_qty:currentQty, cumulative_qty:cumulativeQty, remaining_qty:remainingQty, rate, previous_value:round2(previousQty*rate), current_value:round2(currentQty*rate), cumulative_value:round2(cumulativeQty*rate), warning:warnings.length>0?warnings.join('; '):null, breakdown_id:bd.id, qs_entry_id:qs?.id??null }
}

export function calculateCertificate(req: GenerateCertificateRequest, breakdowns: DbBreakdown[], qsEntries: DbQsEntry[], priorHistory: DbPriorHistory[], retentionPct: number) {
  const errors: string[] = []; const warnings: string[] = []
  const qsMap = new Map(qsEntries.map(q => [q.assignment_key, q]))
  const histMap = new Map(priorHistory.map(h => [h.assignment_key, h]))
  if (qsEntries.length === 0) errors.push(`No approved QS entries found for cert #${req.cert_no}. Submit and approve QS quantities before generating a certificate.`)
  const lines: CertLine[] = []; let lineNo = 1
  for (const bd of [...breakdowns].sort((a,b) => a.assignment_key.localeCompare(b.assignment_key))) {
    const line = calculateLine(lineNo, bd, qsMap.get(bd.assignment_key), histMap.get(bd.assignment_key))
    if (line.warning) warnings.push(`Line ${lineNo} (${bd.assignment_key}): ${line.warning}`)
    if (line.current_qty > 0 || line.cumulative_qty > 0 || line.warning) { lines.push(line); lineNo++ }
  }
  const gross   = round2(lines.reduce((s,l) => s+l.current_value, 0))
  const retPct  = req.retention_pct ?? retentionPct
  const ret     = round2(gross * retPct)
  const adv     = round2(req.advance_recovery ?? 0)
  const ded     = round2(req.deductions ?? 0)
  const pen     = round2(req.penalties ?? 0)
  const add     = round2(req.other_additions ?? 0)
  const prev    = round2(req.previously_paid ?? 0)
  const net     = round2(gross - ret - adv - ded - pen + add - prev)
  if (gross === 0 && errors.length === 0) warnings.push('Gross amount is zero — all current quantities may be zero')
  if (net < 0) warnings.push(`Net payable is negative (${net.toLocaleString()})`)
  return { lines, summary:{ cert_no:req.cert_no, period_end:req.period_end, gross_amount:gross, retention_pct:retPct, retention_amount:ret, advance_recovery:adv, deductions:ded, penalties:pen, other_additions:add, previously_paid:prev, net_payable:net, lines, line_count:lines.length, warnings, has_errors:errors.length>0, errors }, errors, warnings }
}
