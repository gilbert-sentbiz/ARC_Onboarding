import type { Document, DocumentStatus, SegmentInfo, EntitySegment, ServiceSegment } from '../types'

interface DocTemplate {
  type: string
  displayName: string
  isRequired: boolean
  isConditional: boolean
}

const ENTITY_DOCS: Record<EntitySegment, DocTemplate[]> = {
  'SentBiz Corporate': [
    { type: 'biz_registration', displayName: '사업자등록증', isRequired: true, isConditional: false },
    { type: 'corporate_registry', displayName: '법인등기부등본', isRequired: true, isConditional: false },
    { type: 'id_card', displayName: '대표자 신분증 사본', isRequired: true, isConditional: false },
    { type: 'bank_account', displayName: '법인 통장 사본', isRequired: true, isConditional: false },
    { type: 'seal_certificate', displayName: '인감증명서', isRequired: false, isConditional: true },
  ],
  'SentBiz Individual': [
    { type: 'biz_registration', displayName: '사업자등록증', isRequired: true, isConditional: false },
    { type: 'id_card', displayName: '대표자 신분증 사본', isRequired: true, isConditional: false },
    { type: 'bank_account', displayName: '통장 사본', isRequired: true, isConditional: false },
  ],
  'FI': [
    { type: 'incorporation_cert', displayName: 'Certificate of Incorporation', isRequired: true, isConditional: false },
    { type: 'good_standing', displayName: 'Certificate of Good Standing', isRequired: true, isConditional: false },
    { type: 'passport', displayName: '대표자 여권 사본', isRequired: true, isConditional: false },
    { type: 'proof_of_address', displayName: 'Proof of Business Address', isRequired: true, isConditional: false },
    { type: 'aml_policy', displayName: 'AML/CFT Policy Document', isRequired: true, isConditional: false },
    { type: 'shareholder_register', displayName: 'Shareholder Register', isRequired: false, isConditional: true },
  ],
}

const SERVICE_DOCS: Record<ServiceSegment, DocTemplate[]> = {
  'Remittance': [
    { type: 'remittance_contract', displayName: '해외 송금 계약서 또는 거래 계획서', isRequired: false, isConditional: true },
  ],
  'KRW Collection': [
    { type: 'krw_account', displayName: '국내 수금 계좌 정보', isRequired: true, isConditional: false },
    { type: 'contract_sample', displayName: '계약서 또는 PO 샘플', isRequired: false, isConditional: true },
  ],
  'VND Collection': [
    { type: 'vnd_account', displayName: '베트남 수금 계좌 정보', isRequired: true, isConditional: false },
    { type: 'vn_biz_cert', displayName: '베트남 사업 관련 서류', isRequired: false, isConditional: true },
  ],
  '기타 Collection': [
    { type: 'other_account', displayName: '해외 수금 계좌 정보', isRequired: true, isConditional: false },
    { type: 'transaction_structure', displayName: '거래 구조 설명서', isRequired: true, isConditional: false },
  ],
}

export function buildDocuments(caseId: string, segmentInfo: SegmentInfo): Document[] {
  const templates: DocTemplate[] = [...ENTITY_DOCS[segmentInfo.entitySegment]]

  for (const service of segmentInfo.serviceSegments) {
    const serviceDocs = SERVICE_DOCS[service] ?? []
    for (const doc of serviceDocs) {
      if (!templates.some(t => t.type === doc.type)) templates.push(doc)
    }
  }

  return templates.map((t, i) => ({
    id: `doc_${caseId}_${i}`,
    caseId,
    type: t.type,
    displayName: t.displayName,
    status: 'NOT_REQUESTED' as DocumentStatus,
    isRequired: t.isRequired,
    isConditional: t.isConditional,
    uploadedFiles: [],
    revisionHistory: [],
  }))
}
