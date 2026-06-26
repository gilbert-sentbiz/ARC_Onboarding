import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RuleSet, RuleSetHistoryEntry } from '../types'

// ── Initial seed from PRD ─────────────────────────────────────────────────────

export const INITIAL_RULESET: RuleSet = {
  version: 'v1.0.0',
  entityLabels: {
    ENTITY_CORP: '법인',
    ENTITY_INDIV: '개인사업자',
    ENTITY_FI: 'FI',
  },
  serviceLabels: {
    SVC_KRW: 'KRW Collection',
    SVC_VND: 'VND Collection',
    SVC_OTHER_COLL: '기타 Collection',
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
        { type: 'id_card',            displayName: '대표자 신분증 사본 (CEO ID Copy, 공동대표 전원)',    isRequired: true,  isConditional: false },
        { type: 'seal_certificate',   displayName: '법인인감증명서 (Corporate Seal Certificate)',      isRequired: true,  isConditional: false },
        { type: 'bank_account',       displayName: '은행계좌 사본 (Bank Account Copy)',                isRequired: true,  isConditional: false },
        { type: 'contract',           displayName: '계약서 — 거래처 (Contract)',                       isRequired: true,  isConditional: false },
        { type: 'invoice_shipping',   displayName: '샘플 인보이스 및 선적자료 (Sample Invoice & Shipping Docs)', isRequired: true, isConditional: false },
        { type: 'website_url',        displayName: '홈페이지 주소 (Website URL)',                      isRequired: false, isConditional: true  },
      ],
    },
    {
      match: { entity: 'ENTITY_INDIV' },
      docs: [
        { type: 'biz_registration',   displayName: '사업자등록증 (Business Registration Certificate)', isRequired: true,  isConditional: false },
        { type: 'id_card',            displayName: '대표자 신분증 사본 (Representative ID Copy)',      isRequired: true,  isConditional: false },
        { type: 'bank_account',       displayName: '은행계좌 사본 (Bank Account Copy)',                isRequired: true,  isConditional: false },
        { type: 'contract',           displayName: '계약서 (Contract)',                                isRequired: true,  isConditional: false },
        { type: 'invoice_shipping',   displayName: '샘플 인보이스 및 선적자료 (Sample Invoice & Shipping Docs)', isRequired: true, isConditional: false },
        { type: 'website_url',        displayName: '홈페이지 주소 (Website URL)',                      isRequired: false, isConditional: true  },
      ],
    },
    {
      match: { entity: 'ENTITY_FI' },
      docs: [
        { type: 'fi_biz_registration', displayName: 'Business Registration',                         isRequired: true,  isConditional: false },
        { type: 'remittance_license',  displayName: 'Remittance License (또는 동등 인허가)',           isRequired: true,  isConditional: false },
        { type: 'internal_policies',   displayName: 'Internal Policies (Compliance/Risk)',            isRequired: true,  isConditional: false },
        { type: 'financial_statements',displayName: 'Audited Financial Statements (최근 3년)',        isRequired: true,  isConditional: false },
        { type: 'aml_audit',           displayName: 'Latest AML Audit Report',                       isRequired: true,  isConditional: false },
        { type: 'org_chart',           displayName: 'Organisational Chart',                          isRequired: true,  isConditional: false },
        { type: 'ownership_chart',     displayName: 'Ownership Chart',                               isRequired: true,  isConditional: false },
        { type: 'directors_list',      displayName: 'Official Document — List of Directors',         isRequired: true,  isConditional: false },
        { type: 'id_copies',           displayName: 'Certified ID Copies — 이사 전원 + UBO 25%+',    isRequired: true,  isConditional: false },
        { type: 'wolfsberg',           displayName: 'Wolfsberg AML Questionnaire',                   isRequired: true,  isConditional: false },
        { type: 'board_resolution',    displayName: 'Board Resolution (서명 권한 위임)',              isRequired: true,  isConditional: false },
        { type: 'bank_proof',          displayName: 'Proof of Bank Account (최근 3개월 내)',          isRequired: true,  isConditional: false },
        { type: 'kyc_merchants',       displayName: 'KYC Documents for Sample Merchants (2건)',      isRequired: false, isConditional: true  },
      ],
    },

    // ── KRW Collection base ─────────────────────────────────────────────────
    {
      match: { service: 'SVC_KRW' },
      docs: [
        { type: 'krw_biz_registration', displayName: 'Certificate of Business Registration', isRequired: true, isConditional: false },
        { type: 'krw_directors',        displayName: 'List of Directors',                    isRequired: true, isConditional: false },
        { type: 'krw_shareholders',     displayName: 'List of Shareholders',                 isRequired: true, isConditional: false },
        { type: 'krw_articles',         displayName: 'Articles of Incorporation',            isRequired: true, isConditional: false },
        { type: 'krw_id_copies',        displayName: 'ID Copies — CEO, 이사, UBO 25%+',     isRequired: true, isConditional: false },
        { type: 'krw_bank_statement',   displayName: 'Bank/E-wallet Statement (회사명 기재)', isRequired: true, isConditional: false },
      ],
    },

    // ── KRW sector-specific ─────────────────────────────────────────────────
    {
      match: { service: 'SVC_KRW', sector: 'SEC_TRADING_B2B' },
      docs: [
        { type: 'krw_sec_shipping',  displayName: '선적서류 (B/L 등)',              isRequired: true, isConditional: false },
        { type: 'krw_sec_trade_lic', displayName: '수출입 신고서 / 라이센스',        isRequired: true, isConditional: false },
        { type: 'krw_sec_invoice',   displayName: '샘플 수출 인보이스',             isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_KRW', sector: 'SEC_TRADING_B2C' },
      docs: [
        { type: 'krw_sec_logistics', displayName: '물류 전표',                     isRequired: true, isConditional: false },
        { type: 'krw_sec_platform',  displayName: '온라인 플랫폼 판매 기록 스크린샷', isRequired: true, isConditional: false },
        { type: 'krw_sec_invoice',   displayName: '샘플 인보이스',                  isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_KRW', sector: 'SEC_CONSULTING' },
      docs: [
        { type: 'krw_sec_contract',  displayName: '고객 계약서 (업무범위)',           isRequired: true, isConditional: false },
        { type: 'krw_sec_report',    displayName: '컨설팅 보고서 / 산출물 샘플',     isRequired: true, isConditional: false },
        { type: 'krw_sec_portfolio', displayName: '포트폴리오',                     isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_KRW', sector: 'SEC_DEV_DESIGN' },
      docs: [
        { type: 'krw_sec_contract',  displayName: '고객 계약서 (기술 스펙)',          isRequired: true, isConditional: false },
        { type: 'krw_sec_project',   displayName: '프로젝트 기획서 또는 진행 스크린샷', isRequired: true, isConditional: false },
        { type: 'krw_sec_portfolio', displayName: '포트폴리오',                     isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_KRW', sector: 'SEC_ADVERTISING' },
      docs: [
        { type: 'krw_sec_contract',  displayName: '고객 계약서',                    isRequired: true, isConditional: false },
        { type: 'krw_sec_ad_output', displayName: '광고 산출물 또는 광고 플랫폼 스크린샷', isRequired: true, isConditional: false },
        { type: 'krw_sec_proposal',  displayName: '마케팅 제안서',                  isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_KRW', sector: 'SEC_RESEARCH' },
      docs: [
        { type: 'krw_sec_contract',  displayName: '고객 계약서',                    isRequired: true, isConditional: false },
        { type: 'krw_sec_output',    displayName: '연구 산출물 (보고서, 분석, 데이터)', isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_KRW', sector: 'SEC_IT_COMPUTER' },
      docs: [
        { type: 'krw_sec_contract',  displayName: '고객 계약서 (기술 스펙)',          isRequired: true, isConditional: false },
        { type: 'krw_sec_sw_doc',    displayName: '소프트웨어 / 시스템 문서',         isRequired: true, isConditional: false },
        { type: 'krw_sec_deploy',    displayName: '배포 증빙 스크린샷',              isRequired: true, isConditional: false },
      ],
    },
    {
      match: { service: 'SVC_KRW', sector: 'SEC_COUPANG' },
      docs: [
        { type: 'krw_sec_seller_url',    displayName: 'Coupang 셀러 URL / 판매이력',  isRequired: true, isConditional: false },
        { type: 'krw_sec_settlement',    displayName: 'Coupang 정산서',              isRequired: true, isConditional: false },
        { type: 'krw_sec_service_agree', displayName: 'Service Agreement (Sunrate/Payful)', isRequired: true, isConditional: false },
      ],
    },

    // ── VND Collection ──────────────────────────────────────────────────────
    {
      match: { service: 'SVC_VND' },
      docs: [
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
      match: { service: 'SVC_OTHER_COLL' },
      docs: [
        { type: 'other_account',         displayName: '해외 수금 계좌 정보', isRequired: true, isConditional: false },
        { type: 'transaction_structure', displayName: '거래 구조 설명서',    isRequired: true, isConditional: false },
      ],
    },
  ],

  // ── Entity classification rules ───────────────────────────────────────────
  entityClassificationRules: [
    { id: 'ecr_1', conditionLabel: 'businessType = financial',   conditionType: 'businessType',      conditionValue: 'financial',   result: 'ENTITY_FI'   },
    { id: 'ecr_2', conditionLabel: '설립 국가 = 해외',             conditionType: 'isForeignFounding',                               result: 'ENTITY_FI'   },
    { id: 'ecr_3', conditionLabel: 'businessType = corporation', conditionType: 'businessType',      conditionValue: 'corporation', result: 'ENTITY_CORP'  },
    { id: 'ecr_4', conditionLabel: '(기본값)',                    conditionType: 'default',                                         result: 'ENTITY_INDIV' },
  ],

  // ── Service classification rules ──────────────────────────────────────────
  serviceClassificationRules: [
    { serviceCode: 'SVC_PAYOUT',      triggerServices: ['remittance'], triggerCurrencies: []        },
    { serviceCode: 'SVC_KRW',         triggerServices: ['collection'], triggerCurrencies: ['KRW']   },
    { serviceCode: 'SVC_VND',         triggerServices: ['collection'], triggerCurrencies: ['VND']   },
    { serviceCode: 'SVC_OTHER_COLL',  triggerServices: ['collection'], triggerCurrencies: ['OTHER'] },
  ],

  // ── Question pool (PRD 9.6–9.10) ─────────────────────────────────────────
  questionPool: [
    // Common — apply to all segments (9.6)
    { id: 'q_business_purpose',    label: '사업 목적 및 거래 배경',    inputType: 'textarea', isRequired: true, classification: 'common' },
    { id: 'q_source_of_funds',     label: '자금 출처',                 inputType: 'select',   isRequired: true, classification: 'common',
      options: [
        { value: 'export_proceeds', label: '수출 대금' },
        { value: 'service_income',  label: '서비스 수익' },
        { value: 'investment',      label: '투자금' },
        { value: 'loan',            label: '대출' },
        { value: 'other',           label: '기타' },
      ],
    },
    { id: 'q_counterparty_country', label: '주요 거래 상대방 국가',    inputType: 'text',    isRequired: true,  classification: 'common' },
    { id: 'q_transaction_nature',   label: '예상 거래 성격',           inputType: 'radio',   isRequired: true,  classification: 'common',
      options: [
        { value: 'regular',    label: '정기적 (월정기)' },
        { value: 'occasional', label: '비정기적 (건별)' },
      ],
    },
    // Entity-specific, FI only (9.7) — fixed
    { id: 'q_fi_license_number', label: '인허가 번호',          inputType: 'text', isRequired: true, classification: 'entity', scopeEntity: 'ENTITY_FI',   isFixed: true },
    { id: 'q_fi_regulator',      label: '감독기관명',            inputType: 'text', isRequired: true, classification: 'entity', scopeEntity: 'ENTITY_FI',   isFixed: true },
    { id: 'q_fi_license_type',   label: '인허가 유형',          inputType: 'text', isRequired: true, classification: 'entity', scopeEntity: 'ENTITY_FI',   isFixed: true },
    // Entity-specific, CORP (9.8) — fixed
    { id: 'q_corp_ubo_name',  label: 'UBO 성명 (지분 25% 이상)', inputType: 'text',   isRequired: true, classification: 'entity', scopeEntity: 'ENTITY_CORP', isFixed: true },
    { id: 'q_corp_ubo_share', label: 'UBO 지분율 (%)',           inputType: 'number', isRequired: true, classification: 'entity', scopeEntity: 'ENTITY_CORP', isFixed: true },
    // Service-specific, SVC_KRW (9.9) — fixed
    { id: 'q_krw_business_line', label: '주요 거래 업종/품목', inputType: 'text', isRequired: true, classification: 'service', scopeService: 'SVC_KRW', isFixed: true },
    // Service-specific, SVC_VND (9.10) — fixed
    { id: 'q_vnd_export_goods', label: '수출 상품/서비스 유형', inputType: 'text', isRequired: true, classification: 'service', scopeService: 'SVC_VND', isFixed: true },
  ],

  // ── Segment question configs ────────────────────────────────────────────
  segmentQuestionConfigs: [
    { key: 'entity:ENTITY_CORP',  enabledCommonQuestionIds: ['q_business_purpose','q_source_of_funds','q_counterparty_country','q_transaction_nature'], ownQuestions: [] },
    { key: 'entity:ENTITY_INDIV', enabledCommonQuestionIds: ['q_business_purpose','q_source_of_funds','q_counterparty_country','q_transaction_nature'], ownQuestions: [] },
    { key: 'entity:ENTITY_FI',    enabledCommonQuestionIds: ['q_business_purpose','q_source_of_funds','q_counterparty_country','q_transaction_nature'], ownQuestions: [] },
    { key: 'service:SVC_KRW',          enabledCommonQuestionIds: ['q_business_purpose','q_counterparty_country'], ownQuestions: [] },
    { key: 'service:SVC_VND',          enabledCommonQuestionIds: ['q_business_purpose','q_counterparty_country'], ownQuestions: [] },
    { key: 'service:SVC_PAYOUT',        enabledCommonQuestionIds: ['q_business_purpose','q_source_of_funds'],      ownQuestions: [] },
    { key: 'service:SVC_OTHER_COLL',   enabledCommonQuestionIds: ['q_business_purpose','q_source_of_funds'],      ownQuestions: [] },
    { key: 'service:SVC_PAYOUT',       enabledCommonQuestionIds: [],                                              ownQuestions: [] },
  ],
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface RuleStoreState {
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

export function getRuleSet(): RuleSet {
  const rs = useRuleStore.getState().currentRuleSet
  return {
    ...rs,
    questionPool: rs.questionPool?.length ? rs.questionPool : INITIAL_RULESET.questionPool,
    segmentQuestionConfigs: rs.segmentQuestionConfigs?.length ? rs.segmentQuestionConfigs : INITIAL_RULESET.segmentQuestionConfigs,
  }
}
