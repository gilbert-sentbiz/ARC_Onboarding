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

export type IntakeRecord = {
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
export type DocTemplateRule = {
  type: string
  displayName: string
  isRequired: boolean
  isConditional: boolean
}

export type DocumentRule = {
  match: {
    entity?: EntityCode
    service?: ServiceCode
    sector?: SectorCode
  }
  docs: DocTemplateRule[]
}

export type EntityClassificationCondition = {
  field: 'businessType' | 'foundingCountry'
  op: 'eq' | 'neq'
  value: string
}

export type EntityClassificationRule = {
  id: string
  conditionLabel: string
  priority: number
  conditions: EntityClassificationCondition[]
  conditionLogic: 'AND' | 'OR'
  result: EntityCode
}

export type ServiceClassificationRule = {
  serviceCode: ServiceCode
  triggerServices: string[]
  triggerCountries: string[]
}

// PI-41: Question rule types
export type QuestionInputType = 'text' | 'select' | 'radio' | 'textarea' | 'number' | 'multi'
export type QuestionClassification = 'common' | 'entity-own' | 'service-own'

export type QuestionOption = {
  value: string
  label: string
}

export type QuestionRule = {
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
  addButtonLabel?: string            // custom label for repeat-input add button
  // PI-48: tree fields
  repeat?: boolean                   // true = group can be repeated N times
  children?: QuestionRule[]          // conditional tail questions
  showWhen?: { parentId: string; value: string }  // render only when parent answer matches
  labelOverrides?: Record<string, string>          // segment-specific label overrides
}

export type SegmentQuestionConfig = {
  key: string                        // 'entity:ENTITY_CORP' | 'service:SVC_COL_KRW' etc.
  enabledCommonQuestionIds: string[]
  ownQuestions: QuestionRule[]
  commonOptionFilters?: Record<string, string[]>  // questionId -> allowed option values for this segment
  disabledOwnQuestionIds?: string[]  // own questions turned off for this segment (undefined = all on)
}

// PI-81: Document library + segment-mapping model (mirrors question model)
export type DocLibraryItem = {
  type: string
  displayName: string
  isRequired: boolean
  isConditional: boolean
  classification: 'common' | 'entity-own' | 'service-own'
  scope?: EntityCode | ServiceCode   // owning segment for entity-own / service-own
}

export type DocSegmentOverride = {
  displayName?: string
  isRequired?: boolean
  isConditional?: boolean
}

export type DocSegmentConfig = {
  key: string                        // 'entity:ENTITY_CORP' | 'service:SVC_COL_KRW' etc.
  enabledCommonDocTypes: string[]
  ownDocs: DocLibraryItem[]
  commonOverrides?: Record<string, DocSegmentOverride>   // type → per-segment override
  disabledOwnDocTypes?: string[]     // fixed own docs turned off for this segment
}

export type FirstIntakeQuestion = QuestionRule & {
  enabled: boolean
  hint?: string
}

export type RuleSet = {
  version: string
  entityLabels: Record<EntityCode, string>
  serviceLabels: Record<ServiceCode, string>
  sectorLabels: Record<SectorCode, string>
  documentRules: DocumentRule[]
  entityClassificationRules: EntityClassificationRule[]
  serviceClassificationRules: ServiceClassificationRule[]
  questionPool: QuestionRule[]
  segmentQuestionConfigs: SegmentQuestionConfig[]
  firstIntakeQuestions?: FirstIntakeQuestion[]
  docLibrary?: DocLibraryItem[]
  segmentDocConfigs?: DocSegmentConfig[]
}

export type RuleSetHistoryEntry = {
  version: string
  savedAt: number
  ruleSet: RuleSet
}

export type UserSession = {
  userId: string
  role: UserRole
  name: string
  email: string
}

export type SegmentInfo = {
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

export type OnboardingFormData = {
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

export type UploadedFile = {
  id: string
  documentId: string
  fileName: string
  fileSize: number
  uploadedAt: number
  uploadedBy: string
  isLatest?: boolean
  dataUrl?: string
}

export type RevisionRecord = {
  documentId: string
  timestamp: number
  requiredBy: string
  reason: string
  resolvedAt?: number
}

export type Document = {
  id: string
  caseId: string
  type: string
  displayName: string
  status: DocumentStatus
  isRequired: boolean
  isConditional: boolean
  isAdHoc?: boolean
  requestedBy?: string
  uploadedFiles: UploadedFile[]
  revisionHistory: RevisionRecord[]
  approvalNote?: string
}

export type Message = {
  id: string
  caseId: string
  sender: { role: UserRole; name: string }
  text: string
  sentAt: number
  readAt?: number
}

export type StatusChangeHistory = {
  id: string
  caseId: string
  previousStatus: CaseStatus | DocumentStatus | null
  newStatus: CaseStatus | DocumentStatus
  changedAt: number
  changedBy: { role: UserRole; name: string }
  closeReason?: CloseReason
  notes?: string
}

export type Case = {
  id: string
  createdAt: number
  updatedAt: number
  status: CaseStatus
  closeReason?: CloseReason
  revisionRequestedFrom?: CaseStatus
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

export type InternalStaff = {
  email: string
  password: string
  role: 'SALES' | 'COMPLIANCE' | 'OPS'
  name: string
}

export type InternalNote = {
  id: string
  caseId: string
  author: { role: UserRole; name: string }
  text: string
  createdAt: number
}

export type NotificationType = 'STATUS_CHANGED' | 'ASSIGNED' | 'REVISION_REQUESTED' | 'NEW_MESSAGE'

export type Notification = {
  id: string
  type: NotificationType
  caseId: string
  caseLabel: string
  message: string
  recipient: { role: UserRole; userId?: string; name?: string }
  createdAt: number
  readAt?: number
}

export type SalesAction = {
  id: string
  caseId: string
  author: { name: string; email: string }
  text: string
  createdAt: number
}
