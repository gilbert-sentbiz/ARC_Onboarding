import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignOut, TreeStructure, Plus, Trash } from '@phosphor-icons/react'
import { useSessionStore } from '../../store/sessionStore'
import { useRuleStore, getRuleSet } from '../../store/ruleStore'
import type { EntityCode, ServiceCode, SectorCode, EntityClassificationRule, ServiceClassificationRule, DocTemplateRule, QuestionRule, SegmentQuestionConfig, QuestionInputType } from '../../types'

type Selection =
  | { type: 'entity'; code: EntityCode }
  | { type: 'service'; code: ServiceCode }

type EntityTab = 'classification' | 'documents' | 'questions'
type ServiceTab = 'condition' | 'documents' | 'questions'

const ENTITY_ORDER: EntityCode[] = ['ENTITY_CORP', 'ENTITY_INDIV', 'ENTITY_FI']
const SERVICE_ORDER: ServiceCode[] = ['SVC_KRW', 'SVC_VND', 'SVC_REMITTANCE', 'SVC_OTHER_COLL', 'SVC_PAYOUT']
const SECTOR_ORDER: SectorCode[] = ['SEC_TRADING_B2B', 'SEC_TRADING_B2C', 'SEC_CONSULTING', 'SEC_DEV_DESIGN', 'SEC_ADVERTISING', 'SEC_RESEARCH', 'SEC_IT_COMPUTER', 'SEC_COUPANG']

function nextVersion(current: string): string {
  const m = current.match(/^v(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return current + '.1'
  return `v${m[1]}.${m[2]}.${parseInt(m[3]) + 1}`
}

// ── Questions editor ──────────────────────────────────────────────────────────

const INPUT_TYPE_OPTIONS: { value: QuestionInputType; label: string }[] = [
  { value: 'text',     label: 'text' },
  { value: 'textarea', label: 'textarea' },
  { value: 'select',   label: 'select' },
  { value: 'radio',    label: 'radio' },
  { value: 'number',   label: 'number' },
]

function AddQuestionForm({ onAdd }: { onAdd: (q: QuestionRule) => void }) {
  const [form, setForm] = useState({ label: '', inputType: 'text' as QuestionInputType, isRequired: true })

  function submit() {
    if (!form.label) return
    const id = `q_own_${Date.now()}`
    onAdd({ id, label: form.label, inputType: form.inputType, isRequired: form.isRequired, classification: 'service' })
    setForm({ label: '', inputType: 'text', isRequired: true })
  }

  return (
    <div className="flex items-end gap-2 pt-3 border-t border-sb-n100 mt-1">
      <div className="flex-1">
        <p className="text-[11px] text-sb-n400 mb-1">질문 레이블</p>
        <input
          placeholder="예: 주요 수출 품목"
          value={form.label}
          onChange={(e) => setForm(p => ({ ...p, label: e.target.value }))}
          className="w-full text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 text-sb-n800 focus:outline-none focus:border-sb-brand"
        />
      </div>
      <div className="w-24">
        <p className="text-[11px] text-sb-n400 mb-1">입력 유형</p>
        <select
          value={form.inputType}
          onChange={(e) => setForm(p => ({ ...p, inputType: e.target.value as QuestionInputType }))}
          className="w-full text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 bg-white focus:outline-none focus:border-sb-brand"
        >
          {INPUT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0 mb-1.5">
        <input
          type="checkbox"
          checked={form.isRequired}
          onChange={(e) => setForm(p => ({ ...p, isRequired: e.target.checked }))}
          className="rounded border-sb-n300 text-sb-brand focus:ring-sb-brand"
        />
        <span className="text-[12px] text-sb-n600">필수</span>
      </label>
      <button
        onClick={submit}
        disabled={!form.label}
        className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-[12px] font-medium bg-sb-brand text-white disabled:opacity-40 mb-px"
      >
        <Plus size={12} />
        추가
      </button>
    </div>
  )
}

function QuestionsEditor({ selected }: { selected: Selection }) {
  const { currentRuleSet, updateRuleSet } = useRuleStore()

  const configKey = selected.type === 'entity' ? `entity:${selected.code}` : `service:${selected.code}`
  const rs = getRuleSet()

  const config: SegmentQuestionConfig = rs.segmentQuestionConfigs.find(c => c.key === configKey)
    ?? { key: configKey, enabledCommonQuestionIds: [], ownQuestions: [] }

  const commonQuestions = rs.questionPool.filter(q => q.classification === 'common')
  const scopedFixedQuestions = rs.questionPool.filter(q => {
    if (selected.type === 'entity') return q.classification === 'entity' && q.scopeEntity === selected.code
    return q.classification === 'service' && q.scopeService === selected.code
  })

  function saveConfig(patch: Partial<SegmentQuestionConfig>) {
    const fullRs = getRuleSet()
    const exists = fullRs.segmentQuestionConfigs.some(c => c.key === configKey)
    const updated: SegmentQuestionConfig[] = exists
      ? fullRs.segmentQuestionConfigs.map(c => c.key === configKey ? { ...c, ...patch } : c)
      : [...fullRs.segmentQuestionConfigs, { ...config, ...patch }]
    updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), segmentQuestionConfigs: updated, questionPool: fullRs.questionPool })
  }

  function toggleCommon(qId: string, enabled: boolean) {
    const next = enabled
      ? [...config.enabledCommonQuestionIds, qId]
      : config.enabledCommonQuestionIds.filter(id => id !== qId)
    saveConfig({ enabledCommonQuestionIds: next })
  }

  function addOwn(q: QuestionRule) {
    saveConfig({ ownQuestions: [...config.ownQuestions, q] })
  }

  function removeOwn(idx: number) {
    saveConfig({ ownQuestions: config.ownQuestions.filter((_, i) => i !== idx) })
  }

  const classificationBadge = (cls: string) => (
    <span className={`inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls === 'common' ? 'bg-blue-50 text-blue-600' : cls === 'entity' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>
      {cls}
    </span>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Common question pool */}
      <div className="bg-white rounded-[10px] border border-sb-n100 p-4">
        <p className="text-[12px] font-semibold text-sb-n500 uppercase tracking-[0.5px] mb-3">공통 질문 풀</p>
        <p className="text-[12px] text-sb-n400 mb-3">이 세그먼트에서 고객에게 표시할 공통 질문을 선택합니다.</p>
        <div className="flex flex-col divide-y divide-sb-n100">
          {commonQuestions.map(q => {
            const isEnabled = config.enabledCommonQuestionIds.includes(q.id)
            return (
              <div key={q.id} className="flex items-center gap-3 py-2.5">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => toggleCommon(q.id, e.target.checked)}
                  className="rounded border-sb-n300 text-sb-brand focus:ring-sb-brand"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-sb-n800">{q.label}</p>
                  <p className="text-[11px] font-mono text-sb-n400">{q.id}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {classificationBadge(q.classification)}
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${q.isRequired ? 'bg-red-50 text-sb-negative' : 'bg-sb-n50 text-sb-n400'}`}>
                    {q.isRequired ? '필수' : '선택'}
                  </span>
                  <span className="text-[10px] font-mono text-sb-n400 px-1.5 py-0.5 border border-sb-n100 rounded">{q.inputType}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Fixed scoped questions (read-only) */}
      {scopedFixedQuestions.length > 0 && (
        <div className="bg-white rounded-[10px] border border-sb-n100 p-4">
          <p className="text-[12px] font-semibold text-sb-n500 uppercase tracking-[0.5px] mb-1">고유 질문 (고정)</p>
          <p className="text-[12px] text-sb-n400 mb-3">이 세그먼트에 항상 표시되는 고정 질문입니다 (PRD 정의, 수정 불가).</p>
          <div className="flex flex-col divide-y divide-sb-n100">
            {scopedFixedQuestions.map(q => (
              <div key={q.id} className="flex items-center gap-3 py-2.5 opacity-70">
                <input type="checkbox" checked readOnly className="rounded border-sb-n300 text-sb-brand" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-sb-n800">{q.label}</p>
                  <p className="text-[11px] font-mono text-sb-n400">{q.id}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {classificationBadge(q.classification)}
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sb-n50 text-sb-n500">고정</span>
                  <span className="text-[10px] font-mono text-sb-n400 px-1.5 py-0.5 border border-sb-n100 rounded">{q.inputType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Own questions */}
      <div className="bg-white rounded-[10px] border border-sb-n100 p-4">
        <p className="text-[12px] font-semibold text-sb-n500 uppercase tracking-[0.5px] mb-1">자체 질문</p>
        <p className="text-[12px] text-sb-n400 mb-3">이 세그먼트에만 추가되는 커스텀 질문입니다.</p>
        {config.ownQuestions.length === 0 && (
          <p className="text-[12px] text-sb-n400 py-2">추가된 자체 질문 없음</p>
        )}
        <div className="flex flex-col divide-y divide-sb-n100">
          {config.ownQuestions.map((q, i) => (
            <div key={q.id} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-sb-n800">{q.label}</p>
                <p className="text-[11px] font-mono text-sb-n400">{q.id}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${q.isRequired ? 'bg-red-50 text-sb-negative' : 'bg-sb-n50 text-sb-n400'}`}>
                  {q.isRequired ? '필수' : '선택'}
                </span>
                <span className="text-[10px] font-mono text-sb-n400 px-1.5 py-0.5 border border-sb-n100 rounded">{q.inputType}</span>
                <button
                  onClick={() => removeOwn(i)}
                  className="flex items-center justify-center w-7 h-7 rounded-[6px] text-sb-n400 hover:text-sb-negative hover:bg-red-50 transition-colors"
                >
                  <Trash size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <AddQuestionForm onAdd={addOwn} />
      </div>

      <p className="text-[11px] text-sb-n400">
        버전: <span className="font-mono font-medium text-sb-n700">{currentRuleSet.version}</span>
        &nbsp;— 변경 시 자동으로 버전이 올라갑니다.
      </p>
    </div>
  )
}

// ── Documents editor ──────────────────────────────────────────────────────────

function DocList({
  docs,
  onUpdate,
  onRemove,
}: {
  docs: DocTemplateRule[]
  onUpdate: (idx: number, patch: Partial<DocTemplateRule>) => void
  onRemove: (idx: number) => void
}) {
  if (docs.length === 0) return <p className="text-[12px] text-sb-n400 py-2">서류 없음</p>

  return (
    <div className="flex flex-col divide-y divide-sb-n100">
      {docs.map((doc, i) => (
        <div key={doc.type} className="grid grid-cols-[1fr_110px_80px_32px] gap-2 items-center py-2">
          <input
            value={doc.displayName}
            onChange={(e) => onUpdate(i, { displayName: e.target.value })}
            className="text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1 text-sb-n800 focus:outline-none focus:border-sb-brand"
          />
          <span className="text-[11px] font-mono text-sb-n400 truncate">{doc.type}</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={doc.isRequired}
              onChange={(e) => onUpdate(i, { isRequired: e.target.checked, isConditional: !e.target.checked })}
              className="rounded border-sb-n300 text-sb-brand focus:ring-sb-brand"
            />
            <span className="text-[12px] text-sb-n600">필수</span>
          </label>
          <button
            onClick={() => onRemove(i)}
            className="flex items-center justify-center w-7 h-7 rounded-[6px] text-sb-n400 hover:text-sb-negative hover:bg-red-50 transition-colors"
          >
            <Trash size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}

function AddDocForm({ onAdd }: { onAdd: (doc: DocTemplateRule) => void }) {
  const [form, setForm] = useState({ type: '', displayName: '', isRequired: true })

  function submit() {
    if (!form.type || !form.displayName) return
    onAdd({ type: form.type, displayName: form.displayName, isRequired: form.isRequired, isConditional: !form.isRequired })
    setForm({ type: '', displayName: '', isRequired: true })
  }

  return (
    <div className="flex items-center gap-2 pt-3 border-t border-sb-n100 mt-1">
      <input
        placeholder="type (snake_case)"
        value={form.type}
        onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
        className="text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 text-sb-n800 w-36 focus:outline-none focus:border-sb-brand"
      />
      <input
        placeholder="displayName"
        value={form.displayName}
        onChange={(e) => setForm(p => ({ ...p, displayName: e.target.value }))}
        className="text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 text-sb-n800 flex-1 focus:outline-none focus:border-sb-brand"
      />
      <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0">
        <input
          type="checkbox"
          checked={form.isRequired}
          onChange={(e) => setForm(p => ({ ...p, isRequired: e.target.checked }))}
          className="rounded border-sb-n300 text-sb-brand focus:ring-sb-brand"
        />
        <span className="text-[12px] text-sb-n600">필수</span>
      </label>
      <button
        onClick={submit}
        disabled={!form.type || !form.displayName}
        className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-[12px] font-medium bg-sb-brand text-white disabled:opacity-40"
      >
        <Plus size={12} />
        추가
      </button>
    </div>
  )
}

function DocumentsEditor({ selected }: { selected: Selection }) {
  const { currentRuleSet, updateRuleSet } = useRuleStore()
  const rs = currentRuleSet

  function updateEntityDocs(code: EntityCode, updater: (docs: DocTemplateRule[]) => DocTemplateRule[]) {
    const updated = rs.documentRules.map(rule =>
      rule.match.entity === code && !rule.match.service && !rule.match.sector
        ? { ...rule, docs: updater(rule.docs) }
        : rule
    )
    updateRuleSet({ ...rs, version: nextVersion(rs.version), documentRules: updated })
  }

  function updateServiceDocs(code: ServiceCode, sector: SectorCode | undefined, updater: (docs: DocTemplateRule[]) => DocTemplateRule[]) {
    const updated = rs.documentRules.map(rule => {
      if (rule.match.service !== code) return rule
      if (sector === undefined && rule.match.sector !== undefined) return rule
      if (sector !== undefined && rule.match.sector !== sector) return rule
      return { ...rule, docs: updater(rule.docs) }
    })
    updateRuleSet({ ...rs, version: nextVersion(rs.version), documentRules: updated })
  }

  if (selected.type === 'entity') {
    const code = selected.code
    const rule = rs.documentRules.find(r => r.match.entity === code && !r.match.service && !r.match.sector)
    const docs = rule?.docs ?? []

    return (
      <div className="flex flex-col gap-3">
        <div className="bg-white rounded-[10px] border border-sb-n100 p-4">
          <p className="text-[12px] font-semibold text-sb-n500 uppercase tracking-[0.5px] mb-3">
            기본 서류 — {rs.entityLabels[code]}
          </p>
          <div className="grid grid-cols-[1fr_110px_80px_32px] gap-2 border-b border-sb-n100 pb-1 mb-1">
            <span className="text-[11px] text-sb-n400">displayName</span>
            <span className="text-[11px] text-sb-n400">type</span>
            <span className="text-[11px] text-sb-n400">필수 여부</span>
            <span />
          </div>
          <DocList
            docs={docs}
            onUpdate={(i, patch) => updateEntityDocs(code, d => d.map((doc, idx) => idx === i ? { ...doc, ...patch } : doc))}
            onRemove={(i) => updateEntityDocs(code, d => d.filter((_, idx) => idx !== i))}
          />
          <AddDocForm onAdd={(doc) => updateEntityDocs(code, d => [...d, doc])} />
        </div>
        <p className="text-[11px] text-sb-n400">
          버전: <span className="font-mono font-medium text-sb-n700">{rs.version}</span>
        </p>
      </div>
    )
  }

  // Service
  const code = selected.code
  const baseRule = rs.documentRules.find(r => r.match.service === code && !r.match.sector)
  const baseDocs = baseRule?.docs ?? []
  const hasKRWSectors = code === 'SVC_KRW'

  return (
    <div className="flex flex-col gap-4">
      {/* Base docs */}
      <div className="bg-white rounded-[10px] border border-sb-n100 p-4">
        <p className="text-[12px] font-semibold text-sb-n500 uppercase tracking-[0.5px] mb-3">
          기본 서류 — {rs.serviceLabels[code]}
        </p>
        <div className="grid grid-cols-[1fr_110px_80px_32px] gap-2 border-b border-sb-n100 pb-1 mb-1">
          <span className="text-[11px] text-sb-n400">displayName</span>
          <span className="text-[11px] text-sb-n400">type</span>
          <span className="text-[11px] text-sb-n400">필수 여부</span>
          <span />
        </div>
        <DocList
          docs={baseDocs}
          onUpdate={(i, patch) => updateServiceDocs(code, undefined, d => d.map((doc, idx) => idx === i ? { ...doc, ...patch } : doc))}
          onRemove={(i) => updateServiceDocs(code, undefined, d => d.filter((_, idx) => idx !== i))}
        />
        <AddDocForm onAdd={(doc) => updateServiceDocs(code, undefined, d => [...d, doc])} />
      </div>

      {/* Sector slots — KRW only */}
      {hasKRWSectors && (
        <div className="flex flex-col gap-3">
          <p className="text-[13px] font-semibold text-sb-n700">섹터 조건부 서류</p>
          {SECTOR_ORDER.map(sector => {
            const sectorRule = rs.documentRules.find(r => r.match.service === code && r.match.sector === sector)
            const sectorDocs = sectorRule?.docs ?? []
            return (
              <div key={sector} className="bg-white rounded-[10px] border border-sb-n100 p-4">
                <p className="text-[12px] font-semibold text-sb-n500 uppercase tracking-[0.5px] mb-3">
                  <span className="font-mono">{sector}</span> — {rs.sectorLabels[sector]}
                </p>
                <DocList
                  docs={sectorDocs}
                  onUpdate={(i, patch) => updateServiceDocs(code, sector, d => d.map((doc, idx) => idx === i ? { ...doc, ...patch } : doc))}
                  onRemove={(i) => updateServiceDocs(code, sector, d => d.filter((_, idx) => idx !== i))}
                />
                <AddDocForm onAdd={(doc) => {
                  if (sectorRule) {
                    updateServiceDocs(code, sector, d => [...d, doc])
                  } else {
                    // Create new sector rule
                    const newRule = { match: { service: code, sector }, docs: [doc] }
                    updateRuleSet({ ...rs, version: nextVersion(rs.version), documentRules: [...rs.documentRules, newRule] })
                  }
                }} />
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[11px] text-sb-n400">
        버전: <span className="font-mono font-medium text-sb-n700">{rs.version}</span>
      </p>
    </div>
  )
}

// ── Entity classification editor ──────────────────────────────────────────────

function EntityClassificationEditor() {
  const { currentRuleSet, updateRuleSet } = useRuleStore()
  const rs = currentRuleSet

  function handleResultChange(ruleId: string, newResult: EntityCode) {
    const updated: EntityClassificationRule[] = rs.entityClassificationRules.map(r =>
      r.id === ruleId ? { ...r, result: newResult } : r
    )
    updateRuleSet({ ...rs, version: nextVersion(rs.version), entityClassificationRules: updated })
  }

  const entityOptions: EntityCode[] = ['ENTITY_CORP', 'ENTITY_INDIV', 'ENTITY_FI']

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[12px] text-sb-n400">조건(Condition)은 읽기 전용입니다. 결과(Result)를 변경하면 이후 신규 케이스에 즉시 적용됩니다.</p>
      </div>

      <div className="bg-white rounded-[10px] border border-sb-n100 overflow-hidden">
        <div className="grid grid-cols-[1fr_180px] gap-0 bg-sb-n50 border-b border-sb-n100 px-4 py-2.5">
          <span className="text-[12px] font-semibold text-sb-n500">조건 (Condition)</span>
          <span className="text-[12px] font-semibold text-sb-n500">결과 세그먼트 (Result)</span>
        </div>
        {rs.entityClassificationRules.map((rule, i) => (
          <div
            key={rule.id}
            className={`grid grid-cols-[1fr_180px] gap-0 px-4 py-3 items-center ${i < rs.entityClassificationRules.length - 1 ? 'border-b border-sb-n100' : ''}`}
          >
            <span className="text-[13px] text-sb-n700 font-mono">{rule.conditionLabel}</span>
            <select
              value={rule.result}
              onChange={(e) => handleResultChange(rule.id, e.target.value as EntityCode)}
              className="text-[13px] border border-sb-n200 rounded-[6px] px-2 py-1 text-sb-n800 bg-white focus:outline-none focus:border-sb-brand"
            >
              {entityOptions.map(opt => (
                <option key={opt} value={opt}>{rs.entityLabels[opt]} ({opt})</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-sb-n400">
        버전: <span className="font-mono font-medium text-sb-n700">{rs.version}</span>
        &nbsp;— 변경 시 자동으로 버전이 올라갑니다.
      </p>
    </div>
  )
}

// ── Service condition editor ──────────────────────────────────────────────────

function ServiceConditionEditor({ code }: { code: ServiceCode }) {
  const { currentRuleSet, updateRuleSet } = useRuleStore()
  const rs = currentRuleSet

  const rule = rs.serviceClassificationRules.find(r => r.serviceCode === code)

  const allServices = ['remittance', 'collection']
  const allCurrencies = ['KRW', 'VND', 'OTHER']

  function updateRule(patch: Partial<ServiceClassificationRule>) {
    if (!rule) return
    const updated = rs.serviceClassificationRules.map(r =>
      r.serviceCode === code ? { ...r, ...patch } : r
    )
    updateRuleSet({ ...rs, version: nextVersion(rs.version), serviceClassificationRules: updated })
  }

  if (!rule) {
    return (
      <p className="text-[13px] text-sb-n400">이 서비스 코드에 분류 규칙이 없습니다. (SVC_PAYOUT는 2차 인테이크에서 수동 지정)</p>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-[12px] text-sb-n400">1차 인테이크 폼에서 어떤 값이 선택될 때 이 서비스가 트리거되는지 설정합니다.</p>

      <div className="bg-white rounded-[10px] border border-sb-n100 p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-sb-n500 uppercase tracking-[0.5px]">서비스 선택 조건</label>
          <div className="flex flex-wrap gap-3">
            {allServices.map(svc => (
              <label key={svc} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rule.triggerServices.includes(svc)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...rule.triggerServices, svc]
                      : rule.triggerServices.filter(s => s !== svc)
                    updateRule({ triggerServices: next })
                  }}
                  className="rounded border-sb-n300 text-sb-brand focus:ring-sb-brand"
                />
                <span className="text-[13px] text-sb-n700 font-mono">{svc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-sb-n500 uppercase tracking-[0.5px]">
            수금 통화 조건 <span className="font-normal normal-case">(비어있으면 통화 무관)</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {allCurrencies.map(cur => (
              <label key={cur} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rule.triggerCurrencies.includes(cur)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...rule.triggerCurrencies, cur]
                      : rule.triggerCurrencies.filter(c => c !== cur)
                    updateRule({ triggerCurrencies: next })
                  }}
                  className="rounded border-sb-n300 text-sb-brand focus:ring-sb-brand"
                />
                <span className="text-[13px] text-sb-n700 font-mono">{cur}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-sb-n400">
        버전: <span className="font-mono font-medium text-sb-n700">{rs.version}</span>
        &nbsp;— 변경 시 자동으로 버전이 올라갑니다.
      </p>
    </div>
  )
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (t: T) => void
}) {
  return (
    <div className="flex border-b border-sb-n100 mb-5">
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors ${
            active === t.id
              ? 'border-sb-brand text-sb-brand'
              : 'border-transparent text-sb-n500 hover:text-sb-n800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function InternalRulesPanel() {
  const navigate = useNavigate()
  const session = useSessionStore((s) => s.session)
  const clearSession = useSessionStore((s) => s.clearSession)
  const { currentRuleSet } = useRuleStore()
  const rs = currentRuleSet

  const [selected, setSelected] = useState<Selection>({ type: 'entity', code: 'ENTITY_CORP' })
  const [entityTab, setEntityTab] = useState<EntityTab>('classification')
  const [serviceTab, setServiceTab] = useState<ServiceTab>('condition')

  // COMPLIANCE-only guard
  if (!session || session.role !== 'COMPLIANCE') {
    return (
      <div className="min-h-screen bg-sb-n50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-[15px] text-sb-n700 font-medium">접근 권한이 없습니다.</p>
          <p className="text-[13px] text-sb-n400 mt-1">COMPLIANCE 역할만 접근 가능합니다.</p>
          <button
            onClick={() => navigate('/internal/dashboard')}
            className="mt-4 px-4 py-2 rounded-[8px] text-[13px] font-medium bg-sb-brand text-white"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  function handleLogout() {
    clearSession()
    navigate('/internal')
  }

  function selectEntity(code: EntityCode) {
    setSelected({ type: 'entity', code })
    setEntityTab('classification')
  }

  function selectService(code: ServiceCode) {
    setSelected({ type: 'service', code })
    setServiceTab('condition')
  }

  return (
    <div className="min-h-screen bg-sb-n50">
      {/* Header */}
      <header className="bg-white border-b border-sb-n100 sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="/ARC_Onboarding/logos/wordmark-navy.svg" alt="SentBiz" className="h-6 w-auto" />
            <nav className="flex items-center gap-1">
              <button
                className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-sb-n500 hover:text-sb-n800 hover:bg-sb-n50 transition-colors"
                onClick={() => navigate('/internal/dashboard')}
              >
                대시보드
              </button>
              <button
                className="px-3 py-1.5 rounded-[6px] text-[13px] font-medium text-sb-brand bg-sb-blue-100"
                onClick={() => navigate('/internal/rules')}
              >
                Rule 관리
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-sb-n500">
              <span className="font-medium text-sb-n800">{session.name}</span>
              <span className="ml-1 text-sb-n400">({session.role})</span>
            </span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-[13px] text-sb-n400 hover:text-sb-negative transition-colors">
              <SignOut size={15} />
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-6 py-6 flex gap-6">
        {/* ── Left sidebar ─────────────────────────────────────────────────── */}
        <aside className="w-[220px] flex-shrink-0 flex flex-col gap-4">
          <div className="bg-white rounded-[10px] border border-sb-n100 overflow-hidden">
            <div className="px-4 py-3 border-b border-sb-n100 flex items-center gap-2">
              <TreeStructure size={14} className="text-sb-n500" />
              <span className="text-[12px] font-semibold text-sb-n700 uppercase tracking-[0.5px]">분류 규칙</span>
            </div>

            {/* Entity codes */}
            <div className="px-3 pt-2 pb-1">
              <p className="text-[11px] text-sb-n400 uppercase tracking-[0.5px] px-1 mb-1">Entity</p>
              {ENTITY_ORDER.map(code => (
                <button
                  key={code}
                  onClick={() => selectEntity(code)}
                  className={`w-full text-left px-3 py-2 rounded-[6px] text-[13px] transition-colors mb-0.5 ${
                    selected.type === 'entity' && selected.code === code
                      ? 'bg-sb-blue-100 text-sb-brand font-medium'
                      : 'text-sb-n700 hover:bg-sb-n50'
                  }`}
                >
                  <span className="block text-[11px] font-mono">{code}</span>
                  <span className="block text-[12px]">{rs.entityLabels[code]}</span>
                </button>
              ))}
            </div>

            {/* Service codes */}
            <div className="px-3 pt-2 pb-2 border-t border-sb-n100">
              <p className="text-[11px] text-sb-n400 uppercase tracking-[0.5px] px-1 mb-1">Service</p>
              {SERVICE_ORDER.map(code => (
                <button
                  key={code}
                  onClick={() => selectService(code)}
                  className={`w-full text-left px-3 py-2 rounded-[6px] text-[13px] transition-colors mb-0.5 ${
                    selected.type === 'service' && selected.code === code
                      ? 'bg-sb-blue-100 text-sb-brand font-medium'
                      : 'text-sb-n700 hover:bg-sb-n50'
                  }`}
                >
                  <span className="block text-[11px] font-mono">{code}</span>
                  <span className="block text-[12px]">{rs.serviceLabels[code]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Add country — wired in PI-42 */}
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2.5 rounded-[8px] border border-dashed border-sb-n200 text-[13px] text-sb-n400 cursor-not-allowed"
            title="PI-42에서 구현 예정"
          >
            <Plus size={13} />
            국가 추가
          </button>
        </aside>

        {/* ── Content area ─────────────────────────────────────────────────── */}
        <main className="flex-1 bg-white rounded-[12px] border border-sb-n100 p-6 overflow-auto">
          {selected.type === 'entity' && (
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-sb-n100 mb-0">
                <div>
                  <p className="text-[11px] font-mono text-sb-n400">{selected.code}</p>
                  <h2 className="text-[18px] font-semibold text-sb-n900">{rs.entityLabels[selected.code]}</h2>
                </div>
                <span className="ml-auto text-[11px] font-mono bg-sb-n50 border border-sb-n100 px-2 py-1 rounded text-sb-n500">
                  {rs.version}
                </span>
              </div>

              <TabBar
                tabs={[
                  { id: 'classification' as EntityTab, label: 'Classification' },
                  { id: 'documents' as EntityTab, label: 'Documents' },
                  { id: 'questions' as EntityTab, label: 'Questions' },
                ]}
                active={entityTab}
                onChange={setEntityTab}
              />

              {entityTab === 'classification' && <EntityClassificationEditor />}
              {entityTab === 'documents' && <DocumentsEditor selected={selected} />}
              {entityTab === 'questions' && <QuestionsEditor selected={selected} />}
            </div>
          )}

          {selected.type === 'service' && (
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-sb-n100 mb-0">
                <div>
                  <p className="text-[11px] font-mono text-sb-n400">{selected.code}</p>
                  <h2 className="text-[18px] font-semibold text-sb-n900">{rs.serviceLabels[selected.code]}</h2>
                </div>
                <span className="ml-auto text-[11px] font-mono bg-sb-n50 border border-sb-n100 px-2 py-1 rounded text-sb-n500">
                  {rs.version}
                </span>
              </div>

              <TabBar
                tabs={[
                  { id: 'condition' as ServiceTab, label: 'Condition' },
                  { id: 'documents' as ServiceTab, label: 'Documents' },
                  { id: 'questions' as ServiceTab, label: 'Questions' },
                ]}
                active={serviceTab}
                onChange={setServiceTab}
              />

              {serviceTab === 'condition' && <ServiceConditionEditor code={selected.code} />}
              {serviceTab === 'documents' && <DocumentsEditor selected={selected} />}
              {serviceTab === 'questions' && <QuestionsEditor selected={selected} />}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
