// src/types/database.ts
export type ProjectStatus = 'Planning'|'Active'|'On Hold'|'Completed'|'Cancelled'
export type SubcontractorStatus = 'Active'|'Inactive'|'Blacklisted'
export type ApprovalStatus = 'Draft'|'Submitted'|'Approved'|'Rejected'|'Cancelled'
export type CertificateStatus = 'Draft'|'Submitted'|'Approved'|'Paid'|'Cancelled'
export type TechnicalRecordType = 'RFI'|'MIR'|'Material Submittal'|'Shop Drawing'|'Method Statement'|'Technical Query'|'NCR'|'Inspection Request'
export type TechnicalStatus = 'Draft'|'Submitted'|'Under Review'|'Approved'|'Approved with Comments'|'Rejected'|'Closed'|'Overdue'
export type ProcurementStatus = 'PR Raised'|'RFQ Issued'|'PO Issued'|'Partially Delivered'|'Delivered'|'Cancelled'|'Delayed'
export type VariationType = 'Addition'|'Omission'|'Substitution'|'Acceleration'|'Provisional Sum'
export type VariationStatus = 'Draft'|'Submitted'|'Under Review'|'Approved'|'Rejected'|'Partially Approved'
export type PriorityLevel = 'Low'|'Medium'|'High'|'Critical'
export type Discipline = 'Structural'|'Architectural'|'MEP'|'Civil'|'Landscaping'|'Fit-Out'|'Facade'|'Infrastructure'|'Other'
export type UserRole = 'Admin'|'Project Manager'|'QS Engineer'|'Technical Engineer'|'Site Engineer'|'Procurement Officer'|'Finance'|'Viewer'

export interface Project { id:string; project_code:string; project_name:string; client:string|null; location:string|null; contract_value:number|null; start_date:string|null; end_date:string|null; status:ProjectStatus; report_month:string|null; default_retention_pct:number; notes:string|null; created_by:string|null; created_at:string; updated_at:string }
export interface User { id:string; email:string; full_name:string; role:UserRole; is_active:boolean; avatar_url:string|null; created_at:string; updated_at:string }
export interface ProjectUser { id:string; project_id:string; user_id:string; role:UserRole; assigned_at:string }
export interface ProjectStructure { id:string; project_id:string; parent_id:string|null; structure_code:string; structure_name:string; structure_type:'Phase'|'Building'|'Villa'; level_no:number; sort_order:number; is_active:boolean; created_at:string; updated_at:string }
export interface Subcontractor { id:string; subcontractor_code:string; name:string; contact_person:string|null; phone:string|null; email:string|null; address:string|null; tax_registration_no:string|null; commercial_reg_no:string|null; default_retention_pct:number; advance_amount:number|null; advance_recovery_pct:number|null; status:SubcontractorStatus; notes:string|null; created_at:string; updated_at:string }
export interface BoqItem { id:string; project_id:string; structure_id:string|null; item_code:string; description:string; unit:string; boq_qty:number; client_rate:number|null; client_budget:number|null; chapter:string|null; discipline:Discipline|null; csi_ref:string|null; wbs_code:string|null; source_note:string|null; is_provisional:boolean; created_at:string; updated_at:string }
export interface SubcontractBreakdown { id:string; project_id:string; subcontractor_id:string; boq_item_id:string; structure_id:string|null; assignment_key:string; project_model:string|null; subcontract_qty:number; rate:number; contract_value:number|null; client_rate:number|null; notes:string|null; is_active:boolean; created_at:string; updated_at:string }
export interface QsEntry { id:string; project_id:string; breakdown_id:string|null; boq_item_id:string|null; assignment_key:string; cert_no:number; period_end:string; boq_qty:number; actual_survey_qty:number|null; effective_pay_qty:number|null; notes:string|null; submitted_by:string|null; submitted_at:string|null; status:ApprovalStatus; created_at:string; updated_at:string }
export interface QsApproval { id:string; project_id:string; qs_entry_id:string; status:ApprovalStatus; reviewed_by:string|null; review_date:string|null; approved_qty:number|null; comments:string|null; created_at:string; updated_at:string }
export interface Certificate { id:string; project_id:string; subcontractor_id:string; invoice_no:string; invoice_date:string|null; period_end:string; gross_amount:number; retention_pct:number; retention_amount:number; net_amount:number; status:string; remarks:string|null; created_at:string; updated_at:string }
export interface CertificateLine { id:string; invoice_id:string; project_id:string; subcontractor_id:string; breakdown_id:string|null; boq_item_id:string|null; structure_id:string|null; boq_qty:number|null; previous_cumulative_qty:number|null; current_work_pct:number|null; current_qty:number|null; new_cumulative_qty:number|null; rate:number|null; current_value:number|null; cumulative_value:number|null; qs_status:string|null; approved_qty:number|null; remarks:string|null; created_at:string }
export interface TechnicalRecord { id:string; project_id:string; subcontractor_id:string|null; record_type:TechnicalRecordType; reference_no:string; subject:string; discipline:Discipline|null; revision_no:string|null; submission_date:string|null; due_date:string|null; response_date:string|null; status:TechnicalStatus; priority:PriorityLevel; responsible_person:string|null; comments:string|null; attachment_url:string|null; rejection_reason:string|null; boq_item_id:string|null; created_by:string|null; created_at:string; updated_at:string }
export interface ProcurementRecord { id:string; project_id:string; pr_no:string; material:string; boq_item_id:string|null; structure_id:string|null; project_model:string|null; required_qty:number|null; unit:string|null; supplier:string|null; pr_date:string|null; rfq_date:string|null; po_date:string|null; po_number:string|null; po_value:number|null; planned_delivery:string|null; actual_delivery:string|null; notes:string|null; status:ProcurementStatus; created_by:string|null; created_at:string; updated_at:string }
export interface Variation { id:string; project_id:string; subcontractor_id:string|null; boq_item_id:string|null; vo_no:string; description:string; structure_id:string|null; type:VariationType; qty_impact:number|null; unit:string|null; rate:number|null; financial_impact:number|null; time_impact_days:number|null; status:VariationStatus; approved_value:number|null; submitted_by:string|null; approved_by:string|null; approved_at:string|null; remarks:string|null; created_at:string; updated_at:string }

export interface VDashboardKpis { project_id:string; project_name:string; project_status:ProjectStatus; total_subcontract_value:number; total_certified_value:number; remaining_value:number; technical_open:number; technical_overdue:number; procurement_delayed:number; pending_approvals:number }
export interface VCommercialSummary { project_id:string; subcontractor_id:string; subcontractor_code:string; subcontractor_name:string; total_contract_value:number; total_certified_gross:number; total_net_paid:number; remaining_value:number; achievement_pct:number }
export interface VCertificateSummary { project_id:string; subcontractor_id:string; subcontractor_code:string; subcontractor_name:string; total_certificates:number; total_gross:number; total_retention:number; total_net_paid:number; latest_cert_no:number; latest_period:string }
export interface VTechnicalOverdue extends TechnicalRecord { days_overdue:number; project_name:string; subcontractor_name:string|null }
export interface VPendingApproval { id:string; project_id:string; project_name:string; subcontractor_id:string; subcontractor_name:string; assignment_key:string; breakdown_id:string; cert_no:number; period_end:string; boq_qty:number; actual_survey_qty:number|null; effective_pay_qty:number; status:ApprovalStatus; submitted_at:string|null }

export type ProjectInsert = Omit<Project,'id'|'created_at'|'updated_at'>
export type SubcontractorInsert = Omit<Subcontractor,'id'|'created_at'|'updated_at'>
export type BoqItemInsert = Omit<BoqItem,'id'|'client_budget'|'created_at'|'updated_at'>
export type SubcontractBreakdownInsert = Omit<SubcontractBreakdown,'id'|'contract_value'|'created_at'|'updated_at'>
export type QsEntryInsert = Omit<QsEntry,'id'|'effective_pay_qty'|'created_at'|'updated_at'>
export type CostCategory = 'Material' | 'Labor' | 'Equipment' | 'Subcontract' | 'Overhead'
export interface TenderItem { id:string; project_id:string; boq_item_id:string; category:CostCategory; description:string; unit:string|null; qty:number|null; unit_rate:number|null; overhead_pct:number|null; profit_pct:number|null; notes:string|null; created_at:string; updated_at:string }
export type TenderItemInsert = Omit<TenderItem,'id'|'created_at'|'updated_at'>
export type CertificateInsert = Omit<Certificate,'id'|'created_at'|'updated_at'>
export type CertificateLineInsert = Omit<CertificateLine,'id'|'created_at'>
export type TechnicalRecordInsert = Omit<TechnicalRecord,'id'|'created_at'|'updated_at'>
export type ProcurementRecordInsert = Omit<ProcurementRecord,'id'|'created_at'|'updated_at'>
export type VariationInsert = Omit<Variation,'id'|'financial_impact'|'created_at'|'updated_at'>

export interface Database {
  public: {
    Tables: {
      projects:              { Row:Project;              Insert:ProjectInsert;              Update:Partial<ProjectInsert> }
      users:                 { Row:User;                 Insert:Omit<User,'id'|'created_at'|'updated_at'>; Update:Partial<User> }
      subcontractors:        { Row:Subcontractor;        Insert:SubcontractorInsert;        Update:Partial<SubcontractorInsert> }
      boq_items:             { Row:BoqItem;              Insert:BoqItemInsert;              Update:Partial<BoqItemInsert> }
      subcontract_breakdown: { Row:SubcontractBreakdown; Insert:SubcontractBreakdownInsert; Update:Partial<SubcontractBreakdownInsert> }
      qs_entries:            { Row:QsEntry;              Insert:QsEntryInsert;              Update:Partial<QsEntryInsert> }
      qs_approvals:          { Row:QsApproval;           Insert:Omit<QsApproval,'id'|'created_at'|'updated_at'>; Update:Partial<QsApproval> }
      subcontractor_invoices:     { Row:Certificate;      Insert:CertificateInsert;      Update:Partial<CertificateInsert> }
      subcontractor_invoice_lines: { Row:CertificateLine; Insert:CertificateLineInsert; Update:Partial<CertificateLineInsert> }
      technical_records:     { Row:TechnicalRecord;      Insert:TechnicalRecordInsert;      Update:Partial<TechnicalRecordInsert> }
      procurement_records:   { Row:ProcurementRecord;    Insert:ProcurementRecordInsert;    Update:Partial<ProcurementRecordInsert> }
      variations:            { Row:Variation;            Insert:VariationInsert;            Update:Partial<VariationInsert> }
      project_users:         { Row:ProjectUser;          Insert:Omit<ProjectUser,'id'|'assigned_at'>; Update:Partial<ProjectUser> }
      project_structures:     { Row:ProjectStructure;     Insert:Omit<ProjectStructure,'id'|'created_at'|'updated_at'>; Update:Partial<ProjectStructure> }
    }
    Views: {
      v_dashboard_kpis:      { Row:VDashboardKpis }
      v_commercial_summary:  { Row:VCommercialSummary }
      v_certificate_summary: { Row:VCertificateSummary }
      v_technical_overdue:   { Row:VTechnicalOverdue }
      v_pending_approvals:   { Row:VPendingApproval }
    }
    Functions: {}
    Enums: {}
  }
}

export type ActivityStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Suspended'
export interface ScheduleActivity {
  id: string
  project_id: string
  activity_id: string
  activity_name: string
  wbs_code: string | null
  status: ActivityStatus
  original_duration: number | null
  remaining_duration: number | null
  schedule_pct: number | null
  planned_start: string | null
  planned_finish: string | null
  actual_start: string | null
  actual_finish: string | null
  free_float: number | null
  total_float: number | null
  created_at: string
  updated_at: string
}
export type ScheduleActivityInsert = Omit<ScheduleActivity, 'id' | 'created_at' | 'updated_at'>

export interface QtoLine {
  id: string
  project_id: string
  boq_item_id: string
  structure_id: string | null
  description: string
  times: number | null
  length: number | null
  width: number | null
  height: number | null
  qty: number
  notes: string | null
  created_at: string
  updated_at: string
}
export type QtoLineInsert = Omit<QtoLine, 'id' | 'created_at' | 'updated_at'>
export type QtoLineUpdate = Partial<QtoLineInsert>

export type VillaStatus = 'Not Started' | 'In Progress' | 'Completed' | 'On Hold'
export type TradeType = 'Structural' | 'MEP' | 'Finishing' | 'External Works' | 'Landscaping' | 'Other'

export interface VillaUnit {
  id: string
  project_id: string
  phase_id: string
  villa_type_id: string
  villa_no: string
  subcontractor_id: string | null
  status: VillaStatus
  created_at: string
  updated_at: string
}
export type VillaUnitInsert = Omit<VillaUnit, 'id' | 'created_at' | 'updated_at'>

export interface VillaProgress {
  id: string
  project_id: string
  villa_unit_id: string
  trade: TradeType
  completion_pct: number
  notes: string | null
  updated_by: string | null
  updated_at: string
  created_at: string
}
export type VillaProgressInsert = Omit<VillaProgress, 'id' | 'created_at'>
export type VillaProgressUpdate = Partial<VillaProgressInsert>
