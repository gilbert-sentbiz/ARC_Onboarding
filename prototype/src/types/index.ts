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

// PI-38: 3-axis segment codes
export type EntityCode = 'ENTITY_CORP' | 'ENTITY_INDIV' | 'ENTITY_FI'
export type ServiceCode = 'SVC_COL_KRW' | 'SVC_COL_VND' | 'SVC_COL_ETC' | 'SVC_PAYOUT'
export type SectorCode =
  | 'SEC_TRADING_B2B' | 'SEC_TRADING_B2C' | 'SEC_CONSULTING'
  | 'SEC_DEV_DESIGN' | 'SEC_ADVERTISING' | 'SEC_RESEARCH'
  | 'SEC_IT_COMPUTER' | 'SEC_COUPANG'

// Deprecated — kept for backward compat with old localStorage cases
export type EntitySegment = 'SentBiz Corporate' | 'SentBiz Individual' | 'FI'
export type ServiceSegment = 'KRW Collection' | 'VND Collection' | '기타 Collection' | 'Remittance'

// PI-38: RuleSet types (stored in localStorage under 'rule_set')
export interface DocTemplateRule {
  type: string
  displayName: string
  isRequired: boolean
  isConditional: boolean
}

export interface DocumentRule {
  match: {
    entity?: EntityCode
    service?: ServiceCode
    sector?: SectorCode
  }
  docs: DocTemplateRule[]
}

export interface EntityClassificationCondition {
  field: 'businessType' | 'foundingCountry'
  op: 'eq' | 'neq'
  value: string
}

export interface EntityClassificationRule {
  id: string
  conditionLabel: string
  priority: number
  conditions: EntityClassificationCondition[]
  conditionLogic: 'AND' | 'OR'
  result: EntityCode
}

export interface ServiceClassificationRule {
  serviceCode: ServiceCode
  triggerServices: string[]
  triggerCountries: string[]
}

// PI-41: Question rule types
export type QuestionInputType = 'text' | 'select' | 'radio' | 'textarea' | 'number'
export type QuestionClassification = 'common' | 'entity-own' | 'service-own'

export interface QuestionOption {
  value: string
  label: string
}

export interface QuestionRule {
  id: string
  label: string
  inputType: QuestionInputType
  options?: QuestionOption[]
  isRequired: boolean
  classification: QuestionClassification
  scope?: EntityCode | ServiceCode   // owning segment (entity-own / service-own)
  scopeEntity?: EntityCode           // kept for backward compat
  scopeService?: ServiceCode         // kept for backward compat
  isFixed?: boolean
  // PI-48: tree fields
  repeat?: boolean                   // true = group can be repeated N times
  children?: QuestionRule[]          // conditional tail questions
  showWhen?: { parentId: string; value: string }  // render only when parent answer matches
  labelOverrides?: Record<string, string>          // segment-specific label overrides
}

export interface SegmentQuestionConfig {
  key: string                        // 'entity:ENTITY_CORP' | 'service:SVC_COL_KRW' etc.
  enabledCommonQuestionIds: string[]
  ownQuestions: QuestionRule[]
}

export interface RuleSet {
  version: string
  entityLabels: Record<EntityCode, string>
  serviceLabels: Record<ServiceCode, string>
  sectorLabels: Record<SectorCode, string>
  documentRules: DocumentRule[]
  entityClassificationRules: EntityClassificationRule[]
  serviceClassificationRules: ServiceClassificationRule[]
  questionPool: QuestionRule[]
  segmentQuestionConfigs: SegmentQuestionConfig[]
}

export interface RuleSetHistoryEntry {
  version: string
  savedAt: number
  ruleSet: RuleSet
}

export interface UserSession {
  userId: string
  role: UserRole
  name: string
  email: string
}

export interface SegmentInfo {
  // PI-38: 3-axis model
  entity: EntityCode
  services: ServiceCode[]
  sectors: SectorCode[]
  foundingCountry: string
  monthlyVolumeCurrency: string
  monthlyVolume: string
  monthlyCount: string
  // Legacy fields (old localStorage cases may have these)
  entitySegment?: string
  serviceSegments?: string[]
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
  ruleSetVersion?: string
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
