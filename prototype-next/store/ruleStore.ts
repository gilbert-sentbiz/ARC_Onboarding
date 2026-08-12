import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RuleSet, RuleSetHistoryEntry, DocSegmentConfig, SegmentQuestionConfig, FirstIntakeQuestion } from '@/types'

// ── Initial seed from PRD ─────────────────────────────────────────────────────

export const INITIAL_RULESET: RuleSet = {
  version: 'v1.0.0',
  entityLabels: {
    ENTITY_CORP: '법인',
    ENTITY_INDIV: '개인사업자',
    ENTITY_FI: 'FI',
  },
  serviceLabels: {
    SVC_COL_KRW: 'KRW Collection',
    SVC_COL_VND: 'VND Collection',
    SVC_COL_ETC: '기타 Collection',
    SVC_PAYOUT: 'Payout',
  },
  sectorLabels: {
    SEC_TRADING_B2B: 'Trading B2B',
    SEC_TRADING_B2C: 'Trading B2C',
    SEC_CONSULTING: 'Consulting',
    SEC_DEV_DESIGN: 'Dev / Design',
    SEC_ADVERTISING: 'Advertising',
    SEC_RESEARCH: 'Research',
    SEC_IT_COMPUTER: 'IT / Computer',
    SEC_COUPANG: 'Coupang',
  },
  documentRules: [
    // ── Entity base documents ───────────────────────────────────────────────
    {
      match: { entity: 'ENTITY_CORP' },
      docs: [
        { type: 'biz_registration',   displayName: '사업자등록증 (Business Registration Certificate)', isRequired: true,  isConditional: false },
        { type: 'corporate_registry', displayName: '법인등기부등본 (Corporate Registry Extract)',       isRequired: true,  isConditional: false },
        { type: 'shareholder_list',   displayName: '주주명부 (Shareholder List)',                      isRequired: true,  isConditional: false },
        { type: 'id_copy',             displayName: '대표자 신분증 사본 (CEO ID Copy, 공동대표 전원)',    isRequired: true,  isConditional: false },
        { type: 'seal_certificate',   displayName: '법인인감증명서 (Corporate Seal Certificate)',      isRequired: true,  isConditional: false },
        { type: 'bank_account',       displayName: '은행계좌 사본 (Bank Account Copy)',                isRequired: true,  isConditional: false },
        { type: 'contract',           displayName: '계약서 — 거래처 (Contract)',                       isRequired: true,  isConditional: false },
        { type: 'sample_invoice_shipping', displayName: '샘플 인보이스 및 선적자료 (Sample Invoice & Shipping Docs)', isRequired: true, isConditional: false },
        { type: 'website_url',        displayName: '홈페이지 주소 (Website URL)',                      isRequired: false, isConditional: true  },
      ],
    },
    {
      match: { entity: 'ENTITY_INDIV' },
      docs: [
        { type: 'biz_registration',   displayName: '사업자등록증 (Business Registration Certificate)', isRequired: true,  isConditional: false },
        { type: 'id_copy',             displayName: '대표자 신분증 사본 (Representative ID Copy)',      isRequired: true,  isConditional: false },
        { type: 'bank_account',       displayName: '은행계좌 사본 (Bank Account Copy)',                isRequired: true,  isConditional: false },
        { type: 'contract',           displayName: '계약서 (Contract)',                                isRequired: true,  isConditional: false },
        { type: 'sample_invoice_shipping', displayName: '샘플 인보이스 및 선적자료 (Sample Invoice & Shipping Docs)', isRequired: true, isConditional: false },
        { type: 'website_url',        displayName: '홈페이지 주소 (Website URL)',                      isRequired: false, isConditional: true  },
      ],
    },
    {
      match: { entity: 'ENTITY_FI' },
      docs: [
        { type: 'biz_registration',    displayName: 'Business Registration Certificate',              isRequired: true,  isConditional: false },
        { type: 'remittance_license',  displayName: 'Remittance License (또는 동등 인허가)',           isRequired: true,  isConditional: false },
        { type: 'internal_policies',   displayName: 'Internal Policies (Compliance/Risk)',            isRequired: true,  isConditional: false },
        { type: 'financial_statements',displayName: 'Audited Financial Statements (최근 3년)',        isRequired: true,  isConditional: false },
        { type: 'aml_audit',           displayName: 'Latest AML Audit Report',                       isRequired: true,  isConditional: false },
        { type: 'org_chart',           displayName: 'Organisational Chart',                          isRequired: true,  isConditional: false },
        { type: 'ownership_chart',     displayName: 'Ownership Chart',                               isRequired: true,  isConditional: false },
        { type: 'director_list',       displayName: 'List of Directors',                              isRequired: true,  isConditional: false },
        { type: 'id_copy',            displayName: 'Certified ID Copies — 이사 전원 + UBO 25%+',     isRequired: true,  isConditional: false },
        { type: 'wolfsberg',           displayName: 'Wolfsberg AML Questionnaire',                   isRequired: true,  isConditional: false },
        { type: 'board_resolution',    displayName: 'Board Resolution (서명 권한 위임)',              isRequired: true,  isConditional: false },
        { type: 'bank_proof',          displayName: 'Proof of Bank Account (최근 3개월 내)',          isRequired: true,  isConditional: false },
      ],
    },
    // PRD §9.12 #13: kyc_merchants is scoped to KRW Collection FI only
    {
      match: { entity: 'ENTITY_FI', service: 'SVC_COL_KRW' },
      docs: [
        { type: 'kyc_merchants', displayName: 'KYC Documents for Sample Merchants (2건)', isRequired: false, isConditional: true },
      ],
    },

    // ── KRW Collection base ─────────────────────────────────────────────────
    {
      match: { service: 'SVC_COL_KRW' },
      docs: [
        { type: 'biz_registration',     displayName: 'Certificate of Business Registration', isRequired: true, isConditional: false },
        { type: 'director_list',        displayName: 'List of Directors',                    isRequired: true, isConditional: false },
        { type: 'shareholder_list',     displayName: 'List of Shareholders',                 isRequired: true, isConditional: false },
        { type: 'articles_of_incorp',   displayName: 'Articles of Incorporation',            isRequired: true, isConditional: false },
        { type: 'id_copy',              displayName: 'ID Copies — CEO, 이사, UBO 25%+',      isRequired: true, isConditional: false },
        { type: 'krw_bank_statement',   displayName: 'Bank/E-wallet Statement (회사명 기재)', isRequired: true, isConditional: false },
      ],
    },

    // ── KRW sector-specific ─────────────────────────────────────────────────
    {
      match: { service: 'SVC_COL_KRW', sector: 'SEC_TRADING_B2B' },
      docs: [
        { type: 'krw_sec_shipping',  displayName: '선적서류 (B/L 등)',              isRequired: true, isConditional: false },
        { type: 'krw_sec_trade_lic', displayName: '수출입 신고서 / 라이센스',        isRequired: true, isConditional: false },
        { type: 'krw_sec_invoice',   displayName: '샘플 수출 인보이스',             isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_COL_KRW', sector: 'SEC_TRADING_B2C' },
      docs: [
        { type: 'krw_sec_logistics', displayName: '물류 전표',                     isRequired: true, isConditional: false },
        { type: 'krw_sec_platform',  displayName: '온라인 플랫폼 판매 기록 스크린샷', isRequired: true, isConditional: false },
        { type: 'krw_sec_invoice',   displayName: '샘플 인보이스',                  isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_COL_KRW', sector: 'SEC_CONSULTING' },
      docs: [
        { type: 'krw_sec_contract',  displayName: '고객 계약서 (업무범위)',           isRequired: true, isConditional: false },
        { type: 'krw_sec_report',    displayName: '컨설팅 보고서 / 산출물 샘플',     isRequired: true, isConditional: false },
        { type: 'krw_sec_portfolio', displayName: '포트폴리오',                     isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_COL_KRW', sector: 'SEC_DEV_DESIGN' },
      docs: [
        { type: 'krw_sec_contract',  displayName: '고객 계약서 (기술 스펙)',          isRequired: true, isConditional: false },
        { type: 'krw_sec_project',   displayName: '프로젝트 기획서 또는 진행 스크린샷', isRequired: true, isConditional: false },
        { type: 'krw_sec_portfolio', displayName: '포트폴리오',                     isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_COL_KRW', sector: 'SEC_ADVERTISING' },
      docs: [
        { type: 'krw_sec_contract',  displayName: '고객 계약서',                    isRequired: true, isConditional: false },
        { type: 'krw_sec_ad_output', displayName: '광고 산출물 또는 광고 플랫폼 스크린샷', isRequired: true, isConditional: false },
        { type: 'krw_sec_proposal',  displayName: '마케팅 제안서',                  isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_COL_KRW', sector: 'SEC_RESEARCH' },
      docs: [
        { type: 'krw_sec_contract',  displayName: '고객 계약서',                    isRequired: true, isConditional: false },
        { type: 'krw_sec_output',    displayName: '연구 산출물 (보고서, 분석, 데이터)', isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_COL_KRW', sector: 'SEC_IT_COMPUTER' },
      docs: [
        { type: 'krw_sec_contract',  displayName: '고객 계약서 (기술 스펙)',          isRequired: true, isConditional: false },
        { type: 'krw_sec_sw_doc',    displayName: '소프트웨어 / 시스템 문서',         isRequired: true, isConditional: false },
        { type: 'krw_sec_deploy',    displayName: '배포 증빙 스크린샷',              isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_COL_KRW', sector: 'SEC_COUPANG' },
      docs: [
        { type: 'krw_sec_seller_url',    displayName: 'Coupang 셀러 URL / 판매이력',  isRequired: true, isConditional: false },
        { type: 'krw_sec_settlement',    displayName: 'Coupang 정산서',              isRequired: true, isConditional: false },
        { type: 'krw_sec_service_agree', displayName: 'Service Agreement (Sunrate/Payful)', isRequired: true, isConditional: false },
      ],
    },

    // ── VND Collection ──────────────────────────────────────────────────────
    {
      match: { service: 'SVC_COL_VND' },
      docs: [
        { type: 'biz_registration',     displayName: 'Business Registration Certificate',                 isRequired: true,  isConditional: false },
        { type: 'vnd_company_charter',  displayName: 'Company Charter',                                   isRequired: false, isConditional: true  },
        { type: 'vnd_incorporation',    displayName: 'Certificate of Incorporation',                      isRequired: true,  isConditional: false },
        { type: 'director_list',        displayName: 'List of Directors',                                 isRequired: true,  isConditional: false },
        { type: 'shareholder_list',     displayName: "Shareholders' Chart (25%+ 전원)",                   isRequired: true,  isConditional: false },
        { type: 'id_copy',             displayName: 'Passport/ID Copy — UBO, 이사, 대표자',               isRequired: true,  isConditional: false },
        { type: 'vnd_board_resolution', displayName: 'Board Resolution (서명자가 법적 대표가 아닌 경우)',  isRequired: false, isConditional: true  },
        { type: 'vnd_licenses',         displayName: 'Licenses (해당 시)',                                isRequired: false, isConditional: true  },
        { type: 'vnd_address',          displayName: 'Address of UBOs, Directors, Reps, Shareholders',   isRequired: true,  isConditional: false },
        { type: 'vnd_bank_statement',   displayName: 'Bank Statement (SentBe App 사용자만)',              isRequired: false, isConditional: true  },
        { type: 'contract',            displayName: 'Sample Contract',                                    isRequired: true,  isConditional: false },
        { type: 'sample_invoice_shipping', displayName: 'Sample Shipping Documents',                     isRequired: true,  isConditional: false },
        { type: 'vnd_accountant_id',    displayName: "Accountant's ID (베트남 법인만)",                  isRequired: false, isConditional: true  },
        { type: 'vnd_accountant_addr',  displayName: "Accountant's Proof of Address (베트남 법인만)",    isRequired: false, isConditional: true  },
        { type: 'vnd_office_photo',     displayName: 'Office Photo with Company Logo',                   isRequired: false, isConditional: true  },
        { type: 'vnd_website_image',    displayName: 'Image of Product/Service Website',                 isRequired: false, isConditional: true  },
      ],
    },

    // ── Payout / Other ──────────────────────────────────────────────────────
    {
      match: { service: 'SVC_PAYOUT' },
      docs: [
        { type: 'remittance_contract', displayName: '해외 송금 계약서 또는 거래 계획서', isRequired: false, isConditional: true },
      ],
    },
    {
      match: { service: 'SVC_COL_ETC' },
      docs: [
        { type: 'other_account',         displayName: '해외 수금 계좌 정보', isRequired: true, isConditional: false },
        { type: 'transaction_structure', displayName: '거래 구조 설명서',    isRequired: true, isConditional: false },
      ],
    },
  ],

  // ── PI-81: Document library + segment-mapping model ──────────────────────────
  docLibrary: [
    // 공통 서류 (8) — mapped to segments via segmentDocConfigs
    { type: 'BIZ_REGISTRATION',        displayName: '사업자등록증 (Business Registration Certificate)',    isRequired: true,  isConditional: false, classification: 'common' },
    { type: 'ID_COPY',                 displayName: '신분증 사본',                                         isRequired: true,  isConditional: false, classification: 'common' },
    { type: 'SHAREHOLDER_LIST',        displayName: '주주명부 (Shareholder List)',                          isRequired: true,  isConditional: false, classification: 'common' },
    { type: 'DIRECTOR_LIST',           displayName: '이사명부 (Director List)',                             isRequired: true,  isConditional: false, classification: 'common' },
    { type: 'CONTRACT',                displayName: '계약서 (Contract)',                                    isRequired: true,  isConditional: false, classification: 'common' },
    { type: 'SAMPLE_INVOICE_SHIPPING', displayName: '샘플 인보이스 및 선적자료 (Sample Invoice & Shipping)', isRequired: true,  isConditional: false, classification: 'common' },
    { type: 'BANK_PROOF',              displayName: '은행 증빙',                                            isRequired: true,  isConditional: false, classification: 'common' },
    { type: 'WEBSITE_URL',             displayName: '홈페이지 주소 (Website URL)',                          isRequired: false, isConditional: true,  classification: 'common' },
    // 법인 고유
    { type: 'CORPORATE_REGISTRY', displayName: '법인등기부등본 (Corporate Registry Extract)', isRequired: true,  isConditional: false, classification: 'entity-own', scope: 'ENTITY_CORP' },
    { type: 'SEAL_CERTIFICATE',   displayName: '법인인감증명서 (Corporate Seal Certificate)',  isRequired: true,  isConditional: false, classification: 'entity-own', scope: 'ENTITY_CORP' },
    // FI 고유
    { type: 'REMITTANCE_LICENSE',   displayName: 'Remittance License (또는 동등 인허가)',          isRequired: true,  isConditional: false, classification: 'entity-own', scope: 'ENTITY_FI' },
    { type: 'INTERNAL_POLICIES',    displayName: 'Internal Policies (Compliance/Risk)',            isRequired: true,  isConditional: false, classification: 'entity-own', scope: 'ENTITY_FI' },
    { type: 'FINANCIAL_STATEMENTS', displayName: 'Audited Financial Statements (최근 3년)',        isRequired: true,  isConditional: false, classification: 'entity-own', scope: 'ENTITY_FI' },
    { type: 'AML_AUDIT',            displayName: 'Latest AML Audit Report',                       isRequired: true,  isConditional: false, classification: 'entity-own', scope: 'ENTITY_FI' },
    { type: 'ORG_CHART',            displayName: 'Organisational Chart',                          isRequired: true,  isConditional: false, classification: 'entity-own', scope: 'ENTITY_FI' },
    { type: 'WOLFSBERG',            displayName: 'Wolfsberg AML Questionnaire',                   isRequired: true,  isConditional: false, classification: 'entity-own', scope: 'ENTITY_FI' },
    { type: 'BOARD_RESOLUTION',     displayName: 'Board Resolution (서명 권한 위임)',              isRequired: true,  isConditional: false, classification: 'entity-own', scope: 'ENTITY_FI' },
    { type: 'KYC_MERCHANTS',        displayName: 'KYC Documents for Sample Merchants (2건)',      isRequired: false, isConditional: true,  classification: 'entity-own', scope: 'ENTITY_FI' },
    // KRW 고유
    { type: 'ARTICLES_OF_INCORP', displayName: 'Articles of Incorporation', isRequired: true, isConditional: false, classification: 'service-own', scope: 'SVC_COL_KRW' },
    // VND 고유 (9)
    { type: 'VND_COMPANY_CHARTER',  displayName: 'Company Charter',                                              isRequired: false, isConditional: true,  classification: 'service-own', scope: 'SVC_COL_VND' },
    { type: 'VND_INCORPORATION',    displayName: 'Certificate of Incorporation',                                 isRequired: true,  isConditional: false, classification: 'service-own', scope: 'SVC_COL_VND' },
    { type: 'VND_BOARD_RESOLUTION', displayName: 'Board Resolution (서명자가 법적 대표가 아닌 경우)',             isRequired: false, isConditional: true,  classification: 'service-own', scope: 'SVC_COL_VND' },
    { type: 'VND_LICENSES',         displayName: 'Licenses (해당 시)',                                           isRequired: false, isConditional: true,  classification: 'service-own', scope: 'SVC_COL_VND' },
    { type: 'VND_ADDRESS',          displayName: 'Address of UBOs, Directors, Reps, Shareholders',               isRequired: true,  isConditional: false, classification: 'service-own', scope: 'SVC_COL_VND' },
    { type: 'VND_BANK_STATEMENT',   displayName: 'Bank Statement (SentBe App 사용자만)',                         isRequired: false, isConditional: true,  classification: 'service-own', scope: 'SVC_COL_VND' },
    { type: 'VND_ACCOUNTANT_ID',    displayName: "Accountant's ID (베트남 법인만)",                              isRequired: false, isConditional: true,  classification: 'service-own', scope: 'SVC_COL_VND' },
    { type: 'VND_ACCOUNTANT_ADDR',  displayName: "Accountant's Proof of Address (베트남 법인만)",                isRequired: false, isConditional: true,  classification: 'service-own', scope: 'SVC_COL_VND' },
    { type: 'VND_OFFICE_PHOTO',     displayName: 'Office Photo with Company Logo',                               isRequired: false, isConditional: true,  classification: 'service-own', scope: 'SVC_COL_VND' },
    { type: 'VND_WEBSITE_IMAGE',    displayName: 'Image of Product/Service Website',                             isRequired: false, isConditional: true,  classification: 'service-own', scope: 'SVC_COL_VND' },
  ],

  segmentDocConfigs: [
    // 법인: DIRECTOR_LIST 제외 (FI·KRW·VND만) + 오버라이드
    {
      key: 'entity:ENTITY_CORP',
      enabledCommonDocTypes: ['BIZ_REGISTRATION', 'ID_COPY', 'SHAREHOLDER_LIST', 'CONTRACT', 'SAMPLE_INVOICE_SHIPPING', 'BANK_PROOF', 'WEBSITE_URL'],
      ownDocs: [],
      commonOverrides: {
        ID_COPY:    { displayName: '대표자 신분증 사본 (CEO ID Copy, 공동대표 전원)' },
        BANK_PROOF: { displayName: '은행계좌 사본 (Bank Account Copy)' },
      },
    },
    // 개인사업자: SHAREHOLDER_LIST·DIRECTOR_LIST 제외 + 오버라이드
    {
      key: 'entity:ENTITY_INDIV',
      enabledCommonDocTypes: ['BIZ_REGISTRATION', 'ID_COPY', 'CONTRACT', 'SAMPLE_INVOICE_SHIPPING', 'BANK_PROOF', 'WEBSITE_URL'],
      ownDocs: [],
      commonOverrides: {
        ID_COPY:    { displayName: '대표자 신분증 사본 (Representative ID Copy)' },
        BANK_PROOF: { displayName: '은행계좌 사본 (Bank Account Copy)' },
      },
    },
    // FI: SHAREHOLDER_LIST(=Ownership Chart) 추가, CONTRACT·SAMPLE_INVOICE_SHIPPING·WEBSITE_URL 제외
    {
      key: 'entity:ENTITY_FI',
      enabledCommonDocTypes: ['BIZ_REGISTRATION', 'ID_COPY', 'SHAREHOLDER_LIST', 'DIRECTOR_LIST', 'BANK_PROOF'],
      ownDocs: [],
      commonOverrides: {
        ID_COPY:         { displayName: 'Certified ID Copies — 이사 전원 + UBO 25%+' },
        SHAREHOLDER_LIST: { displayName: 'Ownership Chart' },
        BANK_PROOF:      { displayName: 'Proof of Bank Account (최근 3개월 내)' },
      },
    },
    // KRW: CONTRACT·SAMPLE_INVOICE_SHIPPING 제외 (섹터별 고유로 처리)
    {
      key: 'service:SVC_COL_KRW',
      enabledCommonDocTypes: ['BIZ_REGISTRATION', 'ID_COPY', 'SHAREHOLDER_LIST', 'DIRECTOR_LIST', 'BANK_PROOF'],
      ownDocs: [],
      commonOverrides: {
        ID_COPY:    { displayName: 'ID Copies — CEO, 이사, UBO 25%+' },
        BANK_PROOF: { displayName: 'Bank/E-wallet Statement (회사명 기재)' },
      },
    },
    // VND: BANK_PROOF·WEBSITE_URL 추가
    {
      key: 'service:SVC_COL_VND',
      enabledCommonDocTypes: ['BIZ_REGISTRATION', 'ID_COPY', 'SHAREHOLDER_LIST', 'DIRECTOR_LIST', 'CONTRACT', 'SAMPLE_INVOICE_SHIPPING', 'BANK_PROOF', 'WEBSITE_URL'],
      ownDocs: [],
      commonOverrides: {
        ID_COPY:    { displayName: 'Passport/ID Copy — UBO, 이사, 대표자' },
        BANK_PROOF: { displayName: 'Bank Statement (SentBe App 사용자만)' },
      },
    },
    // Payout: 기본 3종
    {
      key: 'service:SVC_PAYOUT',
      enabledCommonDocTypes: ['BIZ_REGISTRATION', 'ID_COPY', 'BANK_PROOF'],
      ownDocs: [],
      commonOverrides: {
        BANK_PROOF: { displayName: '은행계좌 사본 (Bank Account Copy)' },
      },
    },
    // 기타 Collection
    {
      key: 'service:SVC_COL_ETC',
      enabledCommonDocTypes: ['BIZ_REGISTRATION', 'ID_COPY', 'CONTRACT', 'BANK_PROOF'],
      ownDocs: [],
      commonOverrides: {},
    },
  ],

  // ── Entity classification rules (explicit 6-case, priority-ordered, no default) ──
  entityClassificationRules: [
    {
      id: 'ecr_fi_financial',
      conditionLabel: '사업자 유형 = 금융기관 (국가 무관)',
      priority: 1,
      conditions: [
        { field: 'businessType', op: 'eq', value: 'financial' },
      ],
      conditionLogic: 'AND',
      result: 'ENTITY_FI',
    },
    {
      id: 'ecr_fi_overseas_corp',
      conditionLabel: '법인 / 해외',
      priority: 2,
      conditions: [
        { field: 'businessType', op: 'eq', value: 'corporation' },
        { field: 'foundingCountry', op: 'neq', value: 'KR' },
      ],
      conditionLogic: 'AND',
      result: 'ENTITY_FI',
    },
    {
      id: 'ecr_fi_overseas_indiv',
      conditionLabel: '개인 / 해외',
      priority: 3,
      conditions: [
        { field: 'businessType', op: 'eq', value: 'individual' },
        { field: 'foundingCountry', op: 'neq', value: 'KR' },
      ],
      conditionLogic: 'AND',
      result: 'ENTITY_FI',
    },
    {
      id: 'ecr_corp',
      conditionLabel: '법인 / 한국',
      priority: 4,
      conditions: [
        { field: 'businessType', op: 'eq', value: 'corporation' },
        { field: 'foundingCountry', op: 'eq', value: 'KR' },
      ],
      conditionLogic: 'AND',
      result: 'ENTITY_CORP',
    },
    {
      id: 'ecr_indiv',
      conditionLabel: '개인 / 한국',
      priority: 5,
      conditions: [
        { field: 'businessType', op: 'eq', value: 'individual' },
        { field: 'foundingCountry', op: 'eq', value: 'KR' },
      ],
      conditionLogic: 'AND',
      result: 'ENTITY_INDIV',
    },
  ],

  // ── Service classification rules ──────────────────────────────────────────
  serviceClassificationRules: [
    { serviceCode: 'SVC_PAYOUT', triggerServices: ['remittance'], triggerCountries: [] },
    { serviceCode: 'SVC_COL_KRW',   triggerServices: ['collection'], triggerCountries: ['KR'] },
    { serviceCode: 'SVC_COL_VND',   triggerServices: ['collection'], triggerCountries: ['VN'] },
  ],

  // ── Question pool (PRD 9.6–9.10) ─────────────────────────────────────────
  questionPool: [
    // ── Common: form-identical across CORP + INDIV ──────────────────────────
    {
      id: 'qc_biz_reg_no',
      label: '사업자등록번호를 입력해주세요',
      inputType: 'text', isRequired: true, classification: 'common',
    },
    {
      id: 'qc_biz_type',
      label: '사업자등록증에 기재된 업종을 입력해주세요',
      inputType: 'text', isRequired: true, classification: 'common',
    },
    {
      id: 'qc_biz_category',
      label: '사업자등록증에 기재된 업태를 입력해주세요',
      inputType: 'text', isRequired: true, classification: 'common',
    },
    {
      id: 'qc_virtual_asset',
      label: '가상자산사업자(VASP)에 해당하나요?',
      inputType: 'radio', isRequired: true, classification: 'common',
      options: [{ value: 'yes', label: '예' }, { value: 'no', label: '아니오' }],
      children: [
        { id: 'qc_vasp_custody',      label: '자산 수탁 장소를 입력해주세요',                               inputType: 'text',  isRequired: true, classification: 'common', showWhen: { parentId: 'qc_virtual_asset',   value: 'yes' } },
        { id: 'qc_vasp_outside_lic',  label: '설립/인허가 국가 외 고객을 온보딩하나요?',                   inputType: 'radio', isRequired: true, classification: 'common', showWhen: { parentId: 'qc_virtual_asset',   value: 'yes' }, options: [{ value: 'yes', label: '예' }, { value: 'no', label: '아니오' }] },
        { id: 'qc_vasp_cust_country', label: '해당 고객의 거주 국가를 입력해주세요',                       inputType: 'text',  isRequired: true, classification: 'common', showWhen: { parentId: 'qc_vasp_outside_lic', value: 'yes' } },
        { id: 'qc_vasp_lic_used',     label: '비거주 고객 온보딩에 사용하는 인허가를 입력해주세요',         inputType: 'text',  isRequired: true, classification: 'common', showWhen: { parentId: 'qc_vasp_outside_lic', value: 'yes' } },
        { id: 'qc_vasp_purpose',      label: '가상자산 출금·법정화폐 전환 요청의 주요 목적을 입력해주세요', inputType: 'text',  isRequired: true, classification: 'common', showWhen: { parentId: 'qc_virtual_asset',   value: 'yes' } },
      ],
    },
    {
      id: 'qc_fund_source',
      label: '자금 및 재산의 원천을 선택해주세요 (복수 선택 가능)',
      inputType: 'select', isRequired: true, classification: 'common',
      options: [
        { value: 'business_income',    label: '사업소득' },
        { value: 'employment_pension', label: '근로·연금소득' },
        { value: 'real_estate_rent',   label: '부동산 임대소득' },
        { value: 'real_estate_sale',   label: '부동산 양도소득' },
        { value: 'financial_income',   label: '금융소득(이자·배당)' },
        { value: 'inheritance',        label: '상속·증여' },
        { value: 'asset_transfer',     label: '일시 재산양도로 인한 소득' },
        { value: 'other',              label: '기타(직접 입력)' },
      ],
    },

    // ── CORP entity-own (PRD 9.6) ───────────────────────────────────────────
    { id: 'qe_corp_name_kr',   label: '회사명을 한글로 입력해주세요',   inputType: 'text', isRequired: true,  classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true },
    { id: 'qe_corp_name_en',   label: '회사명을 영문으로 입력해주세요', inputType: 'text', isRequired: true,  classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true },
    { id: 'qe_corp_phone',     label: '회사 연락처를 입력해주세요',     inputType: 'text', isRequired: true,  classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true },
    { id: 'qe_corp_address',   label: '사업장 주소를 입력해주세요',     inputType: 'text', isRequired: true,  classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true },
    {
      id: 'qe_corp_type',
      label: '법인 유형을 선택해주세요',
      inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true,
      options: [{ value: 'profit', label: '영리법인' }, { value: 'nonprofit', label: '비영리법인(단체)' }],
    },
    { id: 'qe_corp_reg_no',    label: '법인 등록번호를 입력해주세요',   inputType: 'text', isRequired: true,  classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true },
    { id: 'qe_corp_nation',    label: '법인의 국적을 입력해주세요',     inputType: 'text', isRequired: true,  classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true },
    { id: 'qe_corp_hq_addr',   label: '본점 주소 (사업장 주소와 다른 경우)', inputType: 'text', isRequired: false, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true },
    {
      id: 'qe_corp_rep_type',
      label: '대표자 유형을 선택해주세요',
      inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true,
      options: [{ value: 'single', label: '단독대표' }, { value: 'joint', label: '공동대표' }],
      children: [
        {
          id: 'qe_corp_rep_count', label: '공동대표 인원 수를 입력해주세요',
          inputType: 'number', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP',
          showWhen: { parentId: 'qe_corp_rep_type', value: 'joint' },
        },
      ],
    },
    {
      id: 'qe_corp_rep_group',
      label: '대표자 정보를 입력해주세요',
      inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true,
      repeat: true, addButtonLabel: '대표자 추가하기',
      children: [
        { id: 'qe_corp_rep_name_kr', label: '성명 (한글)', inputType: 'text',   isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP' },
        { id: 'qe_corp_rep_name_en', label: '성명 (영문)', inputType: 'text',   isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP' },
        { id: 'qe_corp_rep_dob',     label: '생년월일',    inputType: 'text',   isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP' },
        { id: 'qe_corp_rep_gender',  label: '성별',        inputType: 'radio',  isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP',
          options: [{ value: 'male', label: '남' }, { value: 'female', label: '여' }] },
        { id: 'qe_corp_rep_nation',  label: '국적',        inputType: 'text',   isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP' },
      ],
    },
    {
      id: 'qe_corp_bo_exempt',
      label: '회사가 다음에 해당하면 선택해주세요',
      inputType: 'radio', isRequired: false, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true,
      options: [
        { value: 'gov',     label: '국가/지자체' },
        { value: 'public',  label: '공공기관' },
        { value: 'fi',      label: '금융회사' },
        { value: 'listed',  label: '상장회사' },
        { value: 'none',    label: '해당없음' },
      ],
    },
    {
      id: 'qe_corp_bo_has_25',
      label: '회사 지분을 25% 이상 보유한 자연인(개인)이 있나요?',
      inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true,
      options: [{ value: 'yes', label: '예' }, { value: 'no', label: '아니오' }],
      showWhen: { parentId: 'qe_corp_bo_exempt', value: 'none' },
    },
    { id: 'qe_corp_bo_count', label: '실제 소유자가 몇 명인가요?', inputType: 'number', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true, showWhen: { parentId: 'qe_corp_bo_exempt', value: 'none' } },
    {
      id: 'qe_corp_bo_group',
      label: '실제 소유자(BO) 정보를 입력해주세요',
      inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true,
      repeat: true, addButtonLabel: '실제 소유자(BO) 추가하기', showWhen: { parentId: 'qe_corp_bo_exempt', value: 'none' },
      children: [
        { id: 'qe_corp_bo_name_kr', label: '성명 (한글)', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP' },
        { id: 'qe_corp_bo_name_en', label: '성명 (영문)', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP' },
        { id: 'qe_corp_bo_dob',     label: '생년월일',    inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP' },
        { id: 'qe_corp_bo_nation',  label: '국적',        inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP' },
        { id: 'qe_corp_bo_country', label: '거주 국가',   inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP' },
      ],
    },
    {
      id: 'qe_corp_purpose',
      label: '센트비를 이용한 거래 목적을 선택해주세요',
      inputType: 'select', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true,
      options: [{ value: 'settlement', label: '판매대금 정산대행' }, { value: 'other', label: '기타(직접 입력)' }],
      children: [
        {
          id: 'qe_corp_purpose_other',
          label: '거래 목적을 직접 입력해주세요',
          inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP',
          showWhen: { parentId: 'qe_corp_purpose', value: 'other' },
        },
      ],
    },
    {
      id: 'qe_corp_size',
      label: '회사 규모를 선택해주세요',
      inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true,
      options: [{ value: 'large', label: '대기업' }, { value: 'sme', label: '중소기업' }],
    },
    {
      id: 'qe_corp_listed',
      label: '상장 여부를 선택해주세요',
      inputType: 'select', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true,
      options: [{ value: 'unlisted', label: '비상장' }, { value: 'kospi', label: '코스피' }, { value: 'kosdaq', label: '코스닥' }, { value: 'other', label: '기타' }],
    },
    { id: 'qe_corp_founded_date', label: '회사 설립일자를 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_CORP', isFixed: true },

    // ── INDIV entity-own (PRD 9.7) ──────────────────────────────────────────
    { id: 'qe_indiv_biz_name',  label: '상호명을 입력해주세요',           inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true },
    { id: 'qe_indiv_phone',     label: '연락처를 입력해주세요',           inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true },
    { id: 'qe_indiv_address',   label: '사업장 주소를 입력해주세요',     inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true },
    {
      id: 'qe_indiv_residence',
      label: '거주지를 선택해주세요',
      inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true,
      options: [{ value: 'domestic', label: '국내' }, { value: 'overseas', label: '국외' }],
    },
    { id: 'qe_indiv_rep_name_kr', label: '대표자 성명 (한글)', inputType: 'text',  isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true },
    { id: 'qe_indiv_rep_name_en', label: '대표자 성명 (영문)', inputType: 'text',  isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true },
    { id: 'qe_indiv_rep_dob',     label: '대표자 생년월일',   inputType: 'text',  isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true },
    {
      id: 'qe_indiv_rep_gender',
      label: '대표자 성별',
      inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true,
      options: [{ value: 'male', label: '남' }, { value: 'female', label: '여' }],
    },
    { id: 'qe_indiv_rep_nation', label: '대표자 국적',          inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true },
    {
      id: 'qe_indiv_bo_same',
      label: '대표자와 실제 소유자가 동일한가요?',
      inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true,
      options: [{ value: 'yes', label: '예' }, { value: 'no', label: '아니오' }],
      children: [
        { id: 'qe_indiv_bo_name_kr', label: '실제 소유자 성명 (한글)', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', showWhen: { parentId: 'qe_indiv_bo_same', value: 'no' } },
        { id: 'qe_indiv_bo_name_en', label: '실제 소유자 성명 (영문)', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', showWhen: { parentId: 'qe_indiv_bo_same', value: 'no' } },
        { id: 'qe_indiv_bo_dob',     label: '실제 소유자 생년월일',   inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', showWhen: { parentId: 'qe_indiv_bo_same', value: 'no' } },
        { id: 'qe_indiv_bo_nation',  label: '실제 소유자 국적',       inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', showWhen: { parentId: 'qe_indiv_bo_same', value: 'no' } },
        { id: 'qe_indiv_bo_country', label: '실제 소유자 거주 국가',  inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', showWhen: { parentId: 'qe_indiv_bo_same', value: 'no' } },
      ],
    },
    {
      id: 'qe_indiv_purpose',
      label: '센트비를 이용한 거래 목적을 선택해주세요',
      inputType: 'select', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV', isFixed: true,
      options: [{ value: 'settlement', label: '판매대금 정산대행' }, { value: 'other', label: '기타(직접 입력)' }],
      children: [
        {
          id: 'qe_indiv_purpose_other',
          label: '거래 목적을 직접 입력해주세요',
          inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_INDIV',
          showWhen: { parentId: 'qe_indiv_purpose', value: 'other' },
        },
      ],
    },

    // ── FI entity-own (PRD 9.8) — Section A ────────────────────────────────
    { id: 'qe_fi_legal_name',     label: '회사의 정식 법적 명칭을 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_legal_form',     label: '법적 형태를 입력해주세요 (예: 주식회사, 합자회사 등)', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_founded_date',   label: '설립일자를 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_incorp_country', label: '설립 국가를 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_biz_reg_no',     label: '사업자등록번호를 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_website',        label: '회사 웹사이트를 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_reg_address',    label: '등록 주소를 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_license_info',   label: '인허가 기관 및 관할 국가를 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_license_detail', label: '인허가 유형, 발급일, 만료일을 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_auditor',        label: '외부 감사인 명칭을 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_rep_name',       label: '대표자 성명을 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_rep_dob',        label: '대표자 생년월일을 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_biz_category',   label: '업종을 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    // Section B — 센트비 이용 서비스
    {
      id: 'qe_fi_svc_select',
      label: '센트비에서 이용하려는 서비스를 선택해주세요',
      inputType: 'select', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true,
      options: [{ value: 'collection', label: '수금(Collection)' }, { value: 'payout', label: '송금(Payout)' }],
    },
    {
      id: 'qe_fi_intermediary',
      label: '다른 FI/MSB/PSP로부터 전달받은 자금을 송금하나요?',
      inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true,
      options: [{ value: 'yes', label: '예' }, { value: 'no', label: '아니오' }],
      children: [
        { id: 'qe_fi_intermediary_levels', label: '몇 단계의 중개 구조인가요?', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', showWhen: { parentId: 'qe_fi_intermediary', value: 'yes' } },
        { id: 'qe_fi_unlic_psp', label: '미인가 FI/PSP/MSB와 거래하나요?', inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', showWhen: { parentId: 'qe_fi_intermediary', value: 'yes' }, options: [{ value: 'yes', label: '예' }, { value: 'no', label: '아니오' }] },
      ],
    },
    // Section C — 자금 원천
    {
      id: 'qe_fi_fund_source',
      label: '자금 원천에 해당하는 항목을 모두 선택해주세요',
      inputType: 'select', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true,
      options: [
        { value: 'capital',    label: '자본금 투입' },
        { value: 'liquidity',  label: '유동성 투자' },
        { value: 'operating',  label: '영업 이익' },
        { value: 'other',      label: '기타(직접 입력)' },
      ],
    },
    // Section D — 소유 구조
    { id: 'qe_fi_parent_name',    label: '모회사 또는 최종 모회사 명칭을 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    { id: 'qe_fi_parent_address', label: '모회사 주소를 입력해주세요', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true },
    {
      id: 'qe_fi_ubo_group',
      label: '지분 25% 이상 소유자 정보를 입력해주세요',
      inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true,
      repeat: true,
      children: [
        { id: 'qe_fi_ubo_name',      label: '이름',    inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI' },
        { id: 'qe_fi_ubo_nation',    label: '국적',    inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI' },
        { id: 'qe_fi_ubo_dob',       label: '생년월일', inputType: 'text', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI' },
        { id: 'qe_fi_ubo_share',     label: '지분율 (%)', inputType: 'number', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI' },
      ],
    },
    // Section E — AML
    { id: 'qe_fi_aml_policy', label: 'AML 정책이 있나요?', inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true, options: [{ value: 'yes', label: '예' }, { value: 'no', label: '아니오' }] },
    { id: 'qe_fi_aml_sanction', label: 'AML 위반으로 행정/금전적 제재를 받은 적이 있나요?', inputType: 'radio', isRequired: true, classification: 'entity-own', scope: 'ENTITY_FI', isFixed: true, options: [{ value: 'yes', label: '예(상세 입력)' }, { value: 'no', label: '아니오' }] },

    // ── KRW service-own (PRD 9.9) ───────────────────────────────────────────
    {
      id: 'qs_krw_sector',
      label: '업종을 선택해주세요',
      inputType: 'select', isRequired: true, classification: 'service-own', scope: 'SVC_COL_KRW', isFixed: true,
      options: [
        { value: 'trading_b2b', label: 'Trading(B2B)' },
        { value: 'trading_b2c', label: 'Trading(B2C)' },
        { value: 'consulting',  label: 'Consulting' },
        { value: 'dev_design',  label: 'Development-Design' },
        { value: 'advertising', label: 'Advertising-Marketing' },
        { value: 'research',    label: 'Research' },
        { value: 'it_computer', label: 'IT & Computer' },
        { value: 'coupang',     label: '쿠팡셀러(Sunrate or Payful)' },
      ],
    },

    // ── VND service-own (PRD 9.10) ──────────────────────────────────────────
    { id: 'qs_vnd_entity_name',    label: '회사 명칭을 입력해주세요',                        inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_biz_reg_no',     label: '사업자등록번호를 입력해주세요 (UEN/NIB/ERC)',     inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_address',        label: '등록 사업장 주소를 입력해주세요',                 inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_incorp_country', label: '설립 국가를 입력해주세요',                       inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_website',        label: '회사 웹사이트를 입력해주세요',                   inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_contact_name',   label: '담당자 이름을 입력해주세요',                     inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_contact_phone',  label: '담당자 연락처를 입력해주세요',                   inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_contact_email',  label: '담당자 이메일을 입력해주세요',                   inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_biz_entity_type',label: '사업자 유형을 선택해주세요',                     inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_biz_type',       label: '업종을 입력해주세요',                            inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_biz_activity',   label: '주요 사업 활동을 입력해주세요',                  inputType: 'textarea',isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_monthly_volume', label: '예상 월간 거래 규모를 입력해주세요',             inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_account_purpose',label: '계좌 개설 목적을 입력해주세요',                  inputType: 'textarea',isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    { id: 'qs_vnd_payer_relation', label: '입금자와의 관계를 입력해주세요',                 inputType: 'text',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
    {
      id: 'qs_vnd_payer_type',
      label: '입금자가 법인인가요, 개인인가요?',
      inputType: 'radio', isRequired: true, classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true,
      options: [{ value: 'corp', label: '법인' }, { value: 'individual', label: '개인' }],
    },
  ],

  // ── Segment question configs ────────────────────────────────────────────
  segmentQuestionConfigs: [
    { key: 'entity:ENTITY_CORP',  enabledCommonQuestionIds: ['qc_biz_reg_no','qc_biz_type','qc_biz_category','qc_virtual_asset','qc_fund_source'], ownQuestions: [], commonOptionFilters: { qc_fund_source: ['business_income','real_estate_rent','real_estate_sale','financial_income','other'] } },
    { key: 'entity:ENTITY_INDIV', enabledCommonQuestionIds: ['qc_biz_reg_no','qc_biz_type','qc_biz_category','qc_virtual_asset','qc_fund_source'], ownQuestions: [] },
    { key: 'entity:ENTITY_FI',    enabledCommonQuestionIds: ['qc_virtual_asset'], ownQuestions: [] },
    { key: 'service:SVC_COL_KRW',     enabledCommonQuestionIds: [], ownQuestions: [
      { id: 'qs_krw_sector', label: '업종을 선택해주세요', inputType: 'select', isRequired: true, classification: 'service-own', scope: 'SVC_COL_KRW', isFixed: true,
        options: [
          { value: 'trading_b2b', label: 'Trading(B2B)' },
          { value: 'trading_b2c', label: 'Trading(B2C)' },
          { value: 'consulting',  label: 'Consulting' },
          { value: 'dev_design',  label: 'Development-Design' },
          { value: 'advertising', label: 'Advertising-Marketing' },
          { value: 'research',    label: 'Research' },
          { value: 'it_computer', label: 'IT & Computer' },
          { value: 'coupang',     label: '쿠팡셀러(Sunrate or Payful)' },
        ],
      },
    ]},
    { key: 'service:SVC_COL_VND', enabledCommonQuestionIds: [], ownQuestions: [
      { id: 'qs_vnd_entity_name',    label: '회사 명칭',        inputType: 'text',    isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_biz_reg_no',     label: '사업자등록번호 (UEN/NIB/ERC)', inputType: 'text', isRequired: true, classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_address',        label: '등록 사업장 주소', inputType: 'text',    isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_incorp_country', label: '설립 국가',        inputType: 'text',    isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_website',        label: '회사 웹사이트',    inputType: 'text',    isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_contact_name',   label: '담당자 이름',      inputType: 'text',    isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_contact_phone',  label: '담당자 연락처',    inputType: 'text',    isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_contact_email',  label: '담당자 이메일',    inputType: 'text',    isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_biz_entity_type',label: '사업자 유형',      inputType: 'text',    isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_biz_type',       label: '업종',             inputType: 'text',    isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_biz_activity',   label: '주요 사업 활동',   inputType: 'textarea',isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_monthly_volume', label: '예상 월간 거래 규모', inputType: 'text', isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_account_purpose',label: '계좌 개설 목적',   inputType: 'textarea',isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_payer_relation', label: '입금자와의 관계',  inputType: 'text',    isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true },
      { id: 'qs_vnd_payer_type',     label: '입금자 유형',      inputType: 'radio',   isRequired: true,  classification: 'service-own', scope: 'SVC_COL_VND', isFixed: true, options: [{ value: 'corp', label: '법인' }, { value: 'individual', label: '개인' }] },
    ]},
    { key: 'service:SVC_PAYOUT',     enabledCommonQuestionIds: [], ownQuestions: [] },
    { key: 'service:SVC_COL_ETC', enabledCommonQuestionIds: [], ownQuestions: [] },
  ],

  // ── 1차 인테이크 질문 (16개) ───────────────────────────────────────────────
  firstIntakeQuestions: [
    { id: 'fi_company_name',          label: '회사명',                  inputType: 'text',     isRequired: true,  classification: 'common', enabled: true },
    { id: 'fi_contact_name',          label: '담당자 이름',              inputType: 'text',     isRequired: true,  classification: 'common', enabled: true },
    { id: 'fi_contact_title',         label: '직함',                   inputType: 'text',     isRequired: false, classification: 'common', enabled: true },
    { id: 'fi_phone',                 label: '연락처',                  inputType: 'text',     isRequired: true,  classification: 'common', enabled: true },
    { id: 'fi_services',              label: '신청 서비스',              inputType: 'select',   isRequired: true,  classification: 'common', enabled: true,
      options: [{ value: 'remittance', label: '해외 송금' }, { value: 'collection', label: '수금' }] },
    { id: 'fi_collection_countries',  label: '수금 국가',               inputType: 'select',   isRequired: true,  classification: 'common', enabled: true,
      showWhen: { parentId: 'fi_services', value: 'collection' }, hint: 'if 서비스=수금' },
    { id: 'fi_collection_other',      label: '기타 수금 국가',           inputType: 'text',     isRequired: false, classification: 'common', enabled: true,
      showWhen: { parentId: 'fi_collection_countries', value: 'OTHER' }, hint: 'if 수금 국가=기타' },
    { id: 'fi_remittance_from',       label: '송금 출발 국가',           inputType: 'select',   isRequired: true,  classification: 'common', enabled: true,
      showWhen: { parentId: 'fi_services', value: 'remittance' }, hint: 'if 서비스=송금' },
    { id: 'fi_remittance_to',         label: '송금 도착 국가',           inputType: 'select',   isRequired: true,  classification: 'common', enabled: true,
      showWhen: { parentId: 'fi_services', value: 'remittance' }, hint: 'if 서비스=송금' },
    { id: 'fi_business_type',         label: '사업자 유형',              inputType: 'radio',    isRequired: true,  classification: 'common', enabled: true,
      options: [{ value: 'financial', label: '금융기관(PG사·PSP·MSB 등)' }, { value: 'corporation', label: '법인 사업자' }, { value: 'individual', label: '개인 사업자' }] },
    { id: 'fi_founding_country',      label: '설립 국가',               inputType: 'select',   isRequired: true,  classification: 'common', enabled: true },
    { id: 'fi_monthly_volume',        label: '예상 월간 거래 규모',       inputType: 'number',   isRequired: true,  classification: 'common', enabled: true },
    { id: 'fi_monthly_currency',      label: '거래 규모 통화',           inputType: 'select',   isRequired: false, classification: 'common', enabled: true },
    { id: 'fi_additional_note',       label: '추가 문의사항',            inputType: 'textarea', isRequired: false, classification: 'common', enabled: true },
  ] as FirstIntakeQuestion[],
}

// ── Store ─────────────────────────────────────────────────────────────────────

type RuleStoreState = {
  currentRuleSet: RuleSet
  history: RuleSetHistoryEntry[]
  updateRuleSet: (next: RuleSet) => void
}

export const useRuleStore = create<RuleStoreState>()(
  persist(
    (set, get) => ({
      currentRuleSet: INITIAL_RULESET,
      history: [],
      updateRuleSet: (next) => {
        const prev = get().currentRuleSet
        set({
          currentRuleSet: next,
          history: [...get().history, { version: prev.version, savedAt: Date.now(), ruleSet: prev }],
        })
      },
    }),
    { name: 'rule_set' }
  )
)

// Merge stored segmentQuestionConfigs with INITIAL_RULESET:
// - Missing segment keys → filled from initial
// - Existing key but missing commonOptionFilters → filled from initial
// Handles stale localStorage saved before PI-80 fix (pre-fix saves lacked commonOptionFilters)
function mergeSegQuestionConfigs(
  stored: SegmentQuestionConfig[] | undefined,
  initial: SegmentQuestionConfig[]
): SegmentQuestionConfig[] {
  if (!stored?.length) return initial
  const initialByKey: Record<string, SegmentQuestionConfig> = Object.fromEntries(initial.map(c => [c.key, c]))
  const storedKeys = new Set(stored.map(c => c.key))
  const merged: SegmentQuestionConfig[] = stored.map(c => ({
    ...c,
    commonOptionFilters: c.commonOptionFilters ?? initialByKey[c.key]?.commonOptionFilters,
  }))
  for (const c of initial) {
    if (!storedKeys.has(c.key)) merged.push(c)
  }
  return merged
}

// Merge stored segmentDocConfigs with INITIAL_RULESET:
// - Missing segment keys → filled from initial
// - Existing key but missing commonOverrides → filled from initial
// Handles partial localStorage saved before PI-81 hotfix (pre-hotfix saves lacked commonOverrides)
function mergeSegDocConfigs(
  stored: DocSegmentConfig[] | undefined,
  initial: DocSegmentConfig[]
): DocSegmentConfig[] {
  if (!stored?.length) return initial
  const initialByKey: Record<string, DocSegmentConfig> = Object.fromEntries(initial.map(c => [c.key, c]))
  const storedKeys = new Set(stored.map(c => c.key))
  const merged: DocSegmentConfig[] = stored.map(c => ({
    ...c,
    commonOverrides: c.commonOverrides ?? initialByKey[c.key]?.commonOverrides,
  }))
  for (const c of initial) {
    if (!storedKeys.has(c.key)) merged.push(c)
  }
  return merged
}

export function getRuleSet(): RuleSet {
  const rs = useRuleStore.getState().currentRuleSet
  // Detect new-format entity rules (split fi_overseas rows); fall back if old format
  const hasNewEntityRules = rs.entityClassificationRules?.length > 0
    && 'conditions' in (rs.entityClassificationRules[0] ?? {})
    && !rs.entityClassificationRules.some(r => r.id === 'ecr_fi_overseas')
  // Detect new-format service rules (have 'triggerCountries'); fall back if old localStorage format
  const hasNewServiceRules = rs.serviceClassificationRules?.length > 0 && 'triggerCountries' in (rs.serviceClassificationRules[0] ?? {})
  // Detect canonical document types; fall back if old localStorage still has pre-canonical codes
  const hasCanonicalDocTypes = !rs.documentRules?.some(r => r.docs.some(d => d.type === 'id_card' || d.type === 'fi_biz_registration'))
  // Detect unified VASP common question (qc_vasp_outside_lic added in PI-64 rev2)
  const hasUnifiedVasp = rs.questionPool?.find((q: { id: string }) => q.id === 'qc_virtual_asset')?.children?.some((c: { id: string }) => c.id === 'qc_vasp_outside_lic')
  return {
    ...rs,
    entityClassificationRules: hasNewEntityRules ? rs.entityClassificationRules : INITIAL_RULESET.entityClassificationRules,
    serviceClassificationRules: hasNewServiceRules ? rs.serviceClassificationRules : INITIAL_RULESET.serviceClassificationRules,
    questionPool: (rs.questionPool?.length && hasUnifiedVasp) ? rs.questionPool : INITIAL_RULESET.questionPool,
    segmentQuestionConfigs: mergeSegQuestionConfigs(rs.segmentQuestionConfigs, INITIAL_RULESET.segmentQuestionConfigs),
    documentRules: hasCanonicalDocTypes ? rs.documentRules : INITIAL_RULESET.documentRules,
    firstIntakeQuestions: rs.firstIntakeQuestions?.length ? rs.firstIntakeQuestions : INITIAL_RULESET.firstIntakeQuestions,
    docLibrary: rs.docLibrary?.length ? rs.docLibrary : INITIAL_RULESET.docLibrary,
    segmentDocConfigs: mergeSegDocConfigs(rs.segmentDocConfigs, INITIAL_RULESET.segmentDocConfigs!),
  }
}
