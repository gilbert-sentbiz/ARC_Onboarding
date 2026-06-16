import type { Document, DocumentStatus, SegmentInfo, EntitySegment, ServiceSegment } from '../types'

interface DocTemplate {
  type: string
  displayName: string
  isRequired: boolean
  isConditional: boolean
}

const ENTITY_DOCS: Record<EntitySegment, DocTemplate[]> = {
  'SentBiz Corporate': [
    { type: 'biz_registration',   displayName: '사업자등록증 (Business Registration Certificate)', isRequired: true,  isConditional: false },
    { type: 'corporate_registry', displayName: '법인등기부등본 (Corporate Registry Extract)',       isRequired: true,  isConditional: false },
    { type: 'shareholder_list',   displayName: '주주명부 (Shareholder List)',                      isRequired: true,  isConditional: false },
    { type: 'id_card',            displayName: '대표자 신분증 사본 (CEO ID Copy, 공동대표 전원)',    isRequired: true,  isConditional: false },
    { type: 'seal_certificate',   displayName: '법인인감증명서 (Corporate Seal Certificate)',      isRequired: true,  isConditional: false },
    { type: 'bank_account',       displayName: '은행계좌 사본 (Bank Account Copy)',                isRequired: true,  isConditional: false },
    { type: 'contract',           displayName: '계약서 — 거래처 (Contract)',                       isRequired: true,  isConditional: false },
    { type: 'invoice_shipping',   displayName: '샘플 인보이스 및 선적자료 (Sample Invoice & Shipping Docs)', isRequired: true, isConditional: false },
    { type: 'website_url',        displayName: '홈페이지 주소 (Website URL)',                      isRequired: false, isConditional: true  },
  ],
  'SentBiz Individual': [
    { type: 'biz_registration',   displayName: '사업자등록증 (Business Registration Certificate)', isRequired: true,  isConditional: false },
    { type: 'id_card',            displayName: '대표자 신분증 사본 (Representative ID Copy)',      isRequired: true,  isConditional: false },
    { type: 'bank_account',       displayName: '은행계좌 사본 (Bank Account Copy)',                isRequired: true,  isConditional: false },
    { type: 'contract',           displayName: '계약서 (Contract)',                                isRequired: true,  isConditional: false },
    { type: 'invoice_shipping',   displayName: '샘플 인보이스 및 선적자료 (Sample Invoice & Shipping Docs)', isRequired: true, isConditional: false },
    { type: 'website_url',        displayName: '홈페이지 주소 (Website URL)',                      isRequired: false, isConditional: true  },
  ],
  'FI': [
    { type: 'fi_biz_registration', displayName: 'Business Registration',                          isRequired: true,  isConditional: false },
    { type: 'remittance_license',  displayName: 'Remittance License (또는 동등 인허가)',            isRequired: true,  isConditional: false },
    { type: 'internal_policies',   displayName: 'Internal Policies (Compliance/Risk)',             isRequired: true,  isConditional: false },
    { type: 'financial_statements',displayName: 'Audited Financial Statements (최근 3년)',         isRequired: true,  isConditional: false },
    { type: 'aml_audit',           displayName: 'Latest AML Audit Report',                        isRequired: true,  isConditional: false },
    { type: 'org_chart',           displayName: 'Organisational Chart',                           isRequired: true,  isConditional: false },
    { type: 'ownership_chart',     displayName: 'Ownership Chart',                                isRequired: true,  isConditional: false },
    { type: 'directors_list',      displayName: 'Official Document — List of Directors',          isRequired: true,  isConditional: false },
    { type: 'id_copies',           displayName: 'Certified ID Copies — 이사 전원 + UBO 25%+',     isRequired: true,  isConditional: false },
    { type: 'wolfsberg',           displayName: 'Wolfsberg AML Questionnaire',                    isRequired: true,  isConditional: false },
    { type: 'board_resolution',    displayName: 'Board Resolution (서명 권한 위임)',               isRequired: true,  isConditional: false },
    { type: 'bank_proof',          displayName: 'Proof of Bank Account (최근 3개월 내)',           isRequired: true,  isConditional: false },
    { type: 'kyc_merchants',       displayName: 'KYC Documents for Sample Merchants (2건)',       isRequired: false, isConditional: true  },
  ],
}

// KRW Collection 기본 서류 (전 업종 공통)
const KRW_BASE_DOCS: DocTemplate[] = [
  { type: 'krw_biz_registration', displayName: 'Certificate of Business Registration', isRequired: true, isConditional: false },
  { type: 'krw_directors',        displayName: 'List of Directors',                    isRequired: true, isConditional: false },
  { type: 'krw_shareholders',     displayName: 'List of Shareholders',                 isRequired: true, isConditional: false },
  { type: 'krw_articles',         displayName: 'Articles of Incorporation',            isRequired: true, isConditional: false },
  { type: 'krw_id_copies',        displayName: 'ID Copies — CEO, 이사, UBO 25%+',     isRequired: true, isConditional: false },
  { type: 'krw_bank_statement',   displayName: 'Bank/E-wallet Statement (회사명 기재)', isRequired: true, isConditional: false },
]

// KRW Collection 섹터별 추가 서류
const KRW_SECTOR_DOCS: Record<string, DocTemplate[]> = {
  trading_b2b: [
    { type: 'krw_sec_shipping',  displayName: '선적서류 (B/L 등)',              isRequired: true, isConditional: false },
    { type: 'krw_sec_trade_lic', displayName: '수출입 신고서 / 라이센스',        isRequired: true, isConditional: false },
    { type: 'krw_sec_invoice',   displayName: '샘플 수출 인보이스',             isRequired: true, isConditional: false },
  ],
  trading_b2c: [
    { type: 'krw_sec_logistics', displayName: '물류 전표',                     isRequired: true, isConditional: false },
    { type: 'krw_sec_platform',  displayName: '온라인 플랫폼 판매 기록 스크린샷', isRequired: true, isConditional: false },
    { type: 'krw_sec_invoice',   displayName: '샘플 인보이스',                  isRequired: true, isConditional: false },
  ],
  consulting: [
    { type: 'krw_sec_contract',  displayName: '고객 계약서 (업무범위)',           isRequired: true, isConditional: false },
    { type: 'krw_sec_report',    displayName: '컨설팅 보고서 / 산출물 샘플',     isRequired: true, isConditional: false },
    { type: 'krw_sec_portfolio', displayName: '포트폴리오',                     isRequired: true, isConditional: false },
  ],
  dev_design: [
    { type: 'krw_sec_contract',  displayName: '고객 계약서 (기술 스펙)',          isRequired: true, isConditional: false },
    { type: 'krw_sec_project',   displayName: '프로젝트 기획서 또는 진행 스크린샷', isRequired: true, isConditional: false },
    { type: 'krw_sec_portfolio', displayName: '포트폴리오',                     isRequired: true, isConditional: false },
  ],
  advertising: [
    { type: 'krw_sec_contract',  displayName: '고객 계약서',                    isRequired: true, isConditional: false },
    { type: 'krw_sec_ad_output', displayName: '광고 산출물 또는 광고 플랫폼 스크린샷', isRequired: true, isConditional: false },
    { type: 'krw_sec_proposal',  displayName: '마케팅 제안서',                  isRequired: true, isConditional: false },
  ],
  research: [
    { type: 'krw_sec_contract',  displayName: '고객 계약서',                    isRequired: true, isConditional: false },
    { type: 'krw_sec_output',    displayName: '연구 산출물 (보고서, 분석, 데이터)', isRequired: true, isConditional: false },
  ],
  it_computer: [
    { type: 'krw_sec_contract',  displayName: '고객 계약서 (기술 스펙)',          isRequired: true, isConditional: false },
    { type: 'krw_sec_sw_doc',    displayName: '소프트웨어 / 시스템 문서',         isRequired: true, isConditional: false },
    { type: 'krw_sec_deploy',    displayName: '배포 증빙 스크린샷',              isRequired: true, isConditional: false },
  ],
  coupang: [
    { type: 'krw_sec_seller_url',    displayName: 'Coupang 셀러 URL / 판매이력',  isRequired: true, isConditional: false },
    { type: 'krw_sec_settlement',    displayName: 'Coupang 정산서',              isRequired: true, isConditional: false },
    { type: 'krw_sec_service_agree', displayName: 'Service Agreement (Sunrate/Payful)', isRequired: true, isConditional: false },
  ],
}

const VND_DOCS: DocTemplate[] = [
  { type: 'vnd_biz_registration', displayName: 'Business Registration Certificate',                 isRequired: true,  isConditional: false },
  { type: 'vnd_company_charter',  displayName: 'Company Charter',                                   isRequired: false, isConditional: true  },
  { type: 'vnd_incorporation',    displayName: 'Certificate of Incorporation',                      isRequired: true,  isConditional: false },
  { type: 'vnd_directors',        displayName: 'List of Directors',                                 isRequired: true,  isConditional: false },
  { type: 'vnd_shareholders',     displayName: "Shareholders' Chart (25%+ 전원)",                   isRequired: true,  isConditional: false },
  { type: 'vnd_id_copies',        displayName: 'Passport/ID Copy — UBO, 이사, 대표자',              isRequired: true,  isConditional: false },
  { type: 'vnd_board_resolution', displayName: 'Board Resolution (서명자가 법적 대표가 아닌 경우)',  isRequired: false, isConditional: true  },
  { type: 'vnd_licenses',         displayName: 'Licenses (해당 시)',                                isRequired: false, isConditional: true  },
  { type: 'vnd_address',          displayName: 'Address of UBOs, Directors, Reps, Shareholders',   isRequired: true,  isConditional: false },
  { type: 'vnd_bank_statement',   displayName: 'Bank Statement (SentBe App 사용자만)',              isRequired: false, isConditional: true  },
  { type: 'vnd_sample_contract',  displayName: 'Sample Contract',                                  isRequired: true,  isConditional: false },
  { type: 'vnd_shipping_docs',    displayName: 'Sample Shipping Documents',                        isRequired: true,  isConditional: false },
  { type: 'vnd_accountant_id',    displayName: "Accountant's ID (베트남 법인만)",                  isRequired: false, isConditional: true  },
  { type: 'vnd_accountant_addr',  displayName: "Accountant's Proof of Address (베트남 법인만)",    isRequired: false, isConditional: true  },
  { type: 'vnd_office_photo',     displayName: 'Office Photo with Company Logo',                   isRequired: false, isConditional: true  },
  { type: 'vnd_website_image',    displayName: 'Image of Product/Service Website',                 isRequired: false, isConditional: true  },
]

const OTHER_SERVICE_DOCS: Record<Exclude<ServiceSegment, 'KRW Collection' | 'VND Collection'>, DocTemplate[]> = {
  'Remittance': [
    { type: 'remittance_contract', displayName: '해외 송금 계약서 또는 거래 계획서', isRequired: false, isConditional: true },
  ],
  '기타 Collection': [
    { type: 'other_account',         displayName: '해외 수금 계좌 정보', isRequired: true, isConditional: false },
    { type: 'transaction_structure', displayName: '거래 구조 설명서',    isRequired: true, isConditional: false },
  ],
}

export function buildDocuments(
  caseId: string,
  segmentInfo: SegmentInfo,
  secondIntakeData?: Record<string, unknown>
): Document[] {
  const templates: DocTemplate[] = [...ENTITY_DOCS[segmentInfo.entitySegment]]

  for (const service of segmentInfo.serviceSegments) {
    if (service === 'KRW Collection') {
      const krwData = secondIntakeData?.krwCollection as Record<string, unknown> | undefined
      const sector = (krwData?.sector as string | undefined) ?? ''
      const sectorDocs = KRW_SECTOR_DOCS[sector] ?? []
      const krwDocs = [...KRW_BASE_DOCS, ...sectorDocs]
      for (const doc of krwDocs) {
        if (!templates.some(t => t.type === doc.type)) templates.push(doc)
      }
    } else if (service === 'VND Collection') {
      for (const doc of VND_DOCS) {
        if (!templates.some(t => t.type === doc.type)) templates.push(doc)
      }
    } else {
      const serviceDocs = OTHER_SERVICE_DOCS[service as keyof typeof OTHER_SERVICE_DOCS] ?? []
      for (const doc of serviceDocs) {
        if (!templates.some(t => t.type === doc.type)) templates.push(doc)
      }
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
