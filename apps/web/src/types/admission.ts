export interface AdmissionEnquiry {
  id: string
  tenant_id: string
  parent_name: string
  email?: string
  phone: string
  student_name: string
  grade_interested: string
  academic_year: string
  source?: string
  status: 'open' | 'contacted' | 'interview_scheduled' | 'converted' | 'rejected'
  notes?: string
  created_at: string
  updated_at: string
}

export interface AdmissionApplication {
  id: string
  tenant_id: string
  enquiry_id?: string
  application_number: string
  status: 'submitted' | 'review' | 'assessment' | 'offered' | 'admitted' | 'declined'
  form_data: Record<string, any>
  documents: any[]
  reviewed_by?: string
  created_at: string
  updated_at: string
  parent_name?: string
  student_name?: string
  grade_interested?: string
  processing_fee_amount?: number
  processing_fee_status?: string
  payment_reference?: string
}
