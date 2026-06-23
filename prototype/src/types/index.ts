export type CaseStatus =
  | 'INQUIRY_RECEIVED'
  | 'DOCUMENT_SUBMISSION_REQUIRED'
  | 'SALES_REVIEW_REQUIRED'
  | 'COMPLIANCE_REVIEW_REQUIRED'
  | 'REVISION_REQUESTED'
  | 'OPS_REVIEW_REQUIRED'
  | 'COMPLETED'
  | 'CLOSED'

export type IntakeStatus = 'not_started' | 'draft' | 'submitted'

export interface IntakeRecord {
  status: IntakeStatus
  data: Record<string, unknown>
  savedAt: number
}

export type DocumentStatus =
  | 'NOT_REQUESTED'
  | 'REQUESTED'
  | 'SUBMITTED'
  | 'REVISION_REQUIRED'
  | 'APPROVED'

export type UserRole = 'CUSTOMER' | 'SALES' | 'COMPLIANCE' | 'OPS'
export type CloseReason = 'DROPPED' | 'EXITED'
export type EntitySegment = 'SentBiz Corporate' | 'SentBiz Individual' | 'FI'
export type ServiceSegment = 'KRW Collection' | 'VND Collection' | '기타 Collection' | 'Remittance'
export type ComplianceRisk = 'LOW' | 'MEDIUM' | 'HIGH'

export interface UserSession {
  userId: string
  role: UserRole
  name: string
  email: string
}

export interface SegmentInfo {
  entitySegment: EntitySegment
  serviceSegments: ServiceSegment[]
  foundingCountry: string
  monthlyVolumeCurrency: string
  monthlyVolume: string
  monthlyCount: string
  complianceRisk: ComplianceRisk
}

export interface OnboardingFormData {
  companyName: string
  contactName: string
  contactTitle: string
  phone: string
  email: string
  services: string[]
  collectionCountries: string[]
  collectionOtherCountry: string
  remittanceFrom: string
  remittanceTo: string
  businessType: string
  foundingCountry: string
  monthlyVolume: string
  monthlyVolumeCurrency: string
  monthlyCount: string
  referralSource: string
  additionalNote: string
}

export interface UploadedFile {
  id: string
  documentId: string
  fileName: string
  fileSize: number
  uploadedAt: number
  uploadedBy: string
  isLatest?: boolean
  dataUrl?: string
}

export interface RevisionRecord {
  documentId: string
  timestamp: number
  requiredBy: string
  reason: string
  resolvedAt?: number
}

export interface Document {
  id: string
  caseId: string
  type: string
  displayName: string
  status: DocumentStatus
  isRequired: boolean
  isConditional: boolean
  uploadedFiles: UploadedFile[]
  revisionHistory: RevisionRecord[]
  approvalNote?: string
}

export interface Message {
  id: string
  caseId: string
  sender: { role: UserRole; name: string }
  text: string
  sentAt: number
  readAt?: number
}

export interface StatusChangeHistory {
  id: string
  caseId: string
  previousStatus: CaseStatus | DocumentStatus | null
  newStatus: CaseStatus | DocumentStatus
  changedAt: number
  changedBy: { role: UserRole; name: string }
  closeReason?: CloseReason
  notes?: string
}

export interface Case {
  id: string
  createdAt: number
  updatedAt: number
  status: CaseStatus
  closeReason?: CloseReason
  customerId: string
  customerName: string
  customerEmail: string
  segmentInfo: SegmentInfo
  currentOwner: { role: UserRole; name: string }
  firstIntake: IntakeRecord
  secondIntake: IntakeRecord
  documents: Document[]
  messages: Message[]
  statusHistory: StatusChangeHistory[]
}

export interface InternalStaff {
  email: string
  password: string
  role: 'SALES' | 'COMPLIANCE' | 'OPS'
  name: string
}

export interface InternalNote {
  id: string
  caseId: string
  author: { role: UserRole; name: string }
  text: string
  createdAt: number
}

export interface SalesAction {
  id: string
  caseId: string
  author: { name: string; email: string }
  text: string
  createdAt: number
}
