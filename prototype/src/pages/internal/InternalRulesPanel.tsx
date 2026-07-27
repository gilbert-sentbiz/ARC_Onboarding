import { useState, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignOut, Plus, Trash, CaretDown, CaretRight, DotsSixVertical } from '@phosphor-icons/react'
import { useSessionStore } from '../../store/sessionStore'
import { useRuleStore, getRuleSet } from '../../store/ruleStore'
import type { EntityCode, ServiceCode, SectorCode, ServiceClassificationRule, DocTemplateRule, QuestionRule, SegmentQuestionConfig, QuestionInputType, EntityClassificationRule, EntityClassificationCondition, FirstIntakeQuestion, DocLibraryItem, DocSegmentConfig } from '../../types'

type Selection =
  | { type: 'entity'; code: EntityCode }
  | { type: 'service'; code: ServiceCode }
  | { type: 'intake' }

const SEGMENT_LABELS: Record<string, string> = {
  'entity:ENTITY_CORP': '법인',
  'entity:ENTITY_INDIV': '개인',
  'entity:ENTITY_FI': 'FI',
  'service:SVC_COL_KRW': 'KRW',
  'service:SVC_COL_VND': 'VND',
  'service:SVC_COL_ETC': '기타',
  'service:SVC_PAYOUT': 'Payout',
}

// After which question ID does Screen 1 end (Screen 2 begins)?
const SCREEN1_LAST_ID: Record<string, string> = {
  ENTITY_CORP: 'qe_corp_rep_group',
  ENTITY_INDIV: 'qe_indiv_rep_nation',
  ENTITY_FI: 'qe_fi_biz_category',
  SVC_COL_VND: 'qs_vnd_contact_email',
  COMMON: 'qc_biz_category',
}

const COLLECTION_CODES = new Set(['SVC_COL_KRW', 'SVC_COL_VND', 'SVC_COL_ETC'])

type EntityTab = 'classification' | 'documents' | 'questions'
type ServiceTab = 'condition' | 'documents' | 'questions'

const ENTITY_ORDER: EntityCode[] = ['ENTITY_CORP', 'ENTITY_INDIV', 'ENTITY_FI']
const SECTOR_ORDER: SectorCode[] = ['SEC_TRADING_B2B', 'SEC_TRADING_B2C', 'SEC_CONSULTING', 'SEC_DEV_DESIGN', 'SEC_ADVERTISING', 'SEC_RESEARCH', 'SEC_IT_COMPUTER', 'SEC_COUPANG']

function nextVersion(current: string): string {
  const m = current.match(/^v(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return current + '.1'
  return `v${m[1]}.${m[2]}.${parseInt(m[3]) + 1}`
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
      <input type="checkbox" checked={checked} onChange={onChange} className="peer sr-only" />
      <div className="w-8 h-[18px] bg-sb-n300 rounded-full peer-checked:bg-sb-brand transition-colors duration-150" />
      <div className="absolute left-[3px] w-3 h-3 bg-white rounded-full shadow-sm peer-checked:translate-x-[14px] transition-transform duration-150" />
    </label>
  )
}

function ScreenDivider({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-y border-blue-100">
      <span className="w-[3px] h-4 rounded-full bg-sb-brand flex-shrink-0" />
      <span className="text-[11px] font-bold text-sb-brand whitespace-nowrap tracking-wide">고객 화면 {n}</span>
      <span className="text-[11px] text-sb-n400 whitespace-nowrap">
        {n === 1 ? '— 기본정보 / 대표자 정보' : '— 여기서부터 새 입력 화면'}
      </span>
      <div className="flex-1 border-t border-dashed border-blue-200" />
    </div>
  )
}

// ── Questions editor ──────────────────────────────────────────────────────────

function AddCommonQuestionForm({ onAdd, onCancel }: {
  onAdd: (q: QuestionRule, segmentKeys: string[]) => void
  onCancel: () => void
}) {
  const rs = getRuleSet()
  const [form, setForm] = useState({
    label: '',
    inputType: 'text' as QuestionInputType,
    isRequired: true,
  })
  const [optionRows, setOptionRows] = useState<{ value: string; label: string }[]>([])
  const [selectedSegments, setSelectedSegments] = useState<string[]>([])

  const qHasOptionField = hasOptions(form.inputType)

  const allSegKeys: { key: string; label: string }[] = [
    ...ENTITY_ORDER.map(e => ({ key: `entity:${e}`, label: SEGMENT_LABELS[`entity:${e}`] ?? e })),
    ...(Object.keys(rs.serviceLabels) as ServiceCode[]).map(s => ({ key: `service:${s}`, label: rs.serviceLabels[s] ?? s })),
  ]

  function toggleSeg(key: string) {
    setSelectedSegments(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  function submit() {
    if (!form.label) return
    const validOptions = optionRows.filter(o => o.value && o.label)
    const q: QuestionRule = {
      id: `qc_${Date.now()}`,
      label: form.label,
      inputType: form.inputType,
      isRequired: form.isRequired,
      classification: 'common',
      ...(validOptions.length ? { options: validOptions } : {}),
    }
    onAdd(q, selectedSegments)
  }

  return (
    <div className="border-t border-sb-n100 px-4 py-3 bg-sb-n50 flex flex-col gap-3">
      <p className="text-[12px] font-semibold text-sb-n700">공통 질문 추가</p>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <p className="text-[11px] text-sb-n400 mb-1">질문 레이블</p>
          <input
            autoFocus
            placeholder="예: 사업자등록번호"
            value={form.label}
            onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
            className="w-full text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 text-sb-n800 focus:outline-none focus:border-sb-brand bg-white"
          />
        </div>
        <div className="w-24">
          <p className="text-[11px] text-sb-n400 mb-1">입력 유형</p>
          <select
            value={form.inputType}
            onChange={e => setForm(p => ({ ...p, inputType: e.target.value as QuestionInputType }))}
            className="w-full text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 bg-white focus:outline-none focus:border-sb-brand"
          >
            {INPUT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer flex-shrink-0 mb-1.5">
          <input type="checkbox" checked={form.isRequired} onChange={e => setForm(p => ({ ...p, isRequired: e.target.checked }))}
            className="rounded border-sb-n300 text-sb-brand focus:ring-sb-brand" />
          <span className="text-[12px] text-sb-n600">필수</span>
        </label>
      </div>

      {qHasOptionField && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] text-sb-n400">옵션 <span className="text-sb-n300">(value / label)</span></p>
          {optionRows.map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input placeholder="value" value={opt.value} onChange={e => setOptionRows(r => r.map((o, j) => j === i ? { ...o, value: e.target.value } : o))}
                className="w-28 text-[11px] font-mono border border-sb-n200 rounded-[6px] px-2 py-1 bg-white focus:outline-none focus:border-sb-brand" />
              <input placeholder="레이블" value={opt.label} onChange={e => setOptionRows(r => r.map((o, j) => j === i ? { ...o, label: e.target.value } : o))}
                className="flex-1 text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1 bg-white focus:outline-none focus:border-sb-brand" />
              <button onClick={() => setOptionRows(r => r.filter((_, j) => j !== i))} className="text-sb-n300 hover:text-sb-negative">
                <Trash size={12} />
              </button>
            </div>
          ))}
          <button onClick={() => setOptionRows(r => [...r, { value: '', label: '' }])}
            className="flex items-center gap-1 text-[11px] text-sb-brand hover:underline self-start">
            <Plus size={11} /> 옵션 추가
          </button>
        </div>
      )}

      <div>
        <p className="text-[11px] text-sb-n400 mb-1.5">적용 세그먼트 <span className="text-sb-n300">(다중 선택)</span></p>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {allSegKeys.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={selectedSegments.includes(key)} onChange={() => toggleSeg(key)}
                className="rounded border-sb-n300 text-sb-brand focus:ring-sb-brand" />
              <span className="text-[12px] text-sb-n700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={submit} disabled={!form.label}
          className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-[12px] font-medium bg-sb-brand text-white disabled:opacity-40">
          <Plus size={12} /> 추가
        </button>
        <button onClick={onCancel} className="text-[12px] text-sb-n500 hover:text-sb-n800 px-2 py-1.5">취소</button>
      </div>
    </div>
  )
}

const INPUT_TYPE_OPTIONS: { value: QuestionInputType; label: string }[] = [
  { value: 'text',     label: 'text' },
  { value: 'textarea', label: 'textarea' },
  { value: 'select',   label: 'select' },
  { value: 'radio',    label: 'radio' },
  { value: 'number',   label: 'number' },
  { value: 'multi',    label: 'multi' },
]

function hasOptions(inputType: QuestionInputType): boolean {
  return inputType === 'select' || inputType === 'radio' || inputType === 'multi'
}

interface DragProps {
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: () => void
  isDragOver: boolean
}

function CommonQuestionRow({ q, enabled, optionFilter, onToggle, onFilterChange, onDelete, dragProps }: {
  q: QuestionRule
  enabled: boolean
  optionFilter: string[] | undefined
  onToggle: () => void
  onFilterChange: (values: string[] | undefined) => void
  onDelete?: () => void
  dragProps?: DragProps
}) {
  const [expanded, setExpanded] = useState(false)
  const qHasChildren = !!(q.children?.length)
  const qHasOptions = hasOptions(q.inputType) && !!q.options?.length
  const enabledCount = optionFilter ? optionFilter.length : (q.options?.length ?? 0)
  const totalCount = q.options?.length ?? 0

  function toggleOption(value: string) {
    const allVals = q.options!.map(o => o.value)
    const current = optionFilter ?? allVals
    const included = current.includes(value)
    const next = included ? current.filter(v => v !== value) : [...current, value]
    onFilterChange(next.length === allVals.length ? undefined : next.length ? next : [value])
  }

  return (
    <>
      <div
        draggable={!!dragProps}
        onDragStart={dragProps?.onDragStart}
        onDragEnd={dragProps?.onDragEnd}
        onDragOver={dragProps?.onDragOver}
        onDrop={dragProps?.onDrop}
        className={`border-b border-sb-n100 last:border-0 ${!enabled ? 'opacity-40' : ''} ${dragProps?.isDragOver ? 'border-t-2 border-sb-brand' : ''}`}
      >
        <div className="flex items-start gap-3 px-4 py-3">
          {dragProps && (
            <span className="flex-shrink-0 mt-1 cursor-grab text-sb-n300 hover:text-sb-n500">
              <DotsSixVertical size={14} />
            </span>
          )}
          <span className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            <ToggleSwitch checked={enabled} onChange={onToggle} />
            {qHasChildren && (
              <button onClick={() => setExpanded(v => !v)} className="text-sb-n400 hover:text-sb-brand">
                {expanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
              </button>
            )}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-sb-n800 leading-snug">{q.label}</p>
            <p className="text-[11px] font-mono text-sb-n400 mt-0.5">{q.id}</p>
            {qHasOptions && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {q.options!.map(opt => {
                  const included = !optionFilter || optionFilter.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      onClick={enabled ? () => toggleOption(opt.value) : undefined}
                      disabled={!enabled}
                      className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                        included
                          ? 'bg-sb-blue-50 border-sb-blue-200 text-sb-brand'
                          : 'bg-sb-n50 border-sb-n200 text-sb-n300 line-through decoration-sb-n300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {qHasOptions && optionFilter && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sb-blue-100 text-sb-brand">
                옵션 {enabledCount}/{totalCount}
              </span>
            )}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${q.isRequired ? 'bg-red-50 text-sb-negative' : 'bg-sb-n50 text-sb-n400'}`}>
              {q.isRequired ? '필수' : '선택'}
            </span>
            <span className="text-[10px] font-mono text-sb-n400 px-1.5 py-0.5 border border-sb-n100 rounded">{q.inputType}</span>
            {onDelete && (
              <button onClick={onDelete} className="flex items-center justify-center w-7 h-7 rounded-[6px] text-sb-n400 hover:text-sb-negative hover:bg-red-50 transition-colors">
                <Trash size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
      {expanded && q.children?.map(child => (
        <QuestionRowFixed key={child.id} q={child} depth={1} />
      ))}
    </>
  )
}

function QuestionRowFixed({ q, depth = 0, allConfigs = [], currentSegKey = '', enabled, onToggle, onDelete, dragProps }: {
  q: QuestionRule
  depth?: number
  allConfigs?: SegmentQuestionConfig[]
  currentSegKey?: string
  enabled?: boolean
  onToggle?: () => void
  onDelete?: () => void
  dragProps?: DragProps
}) {
  const [expanded, setExpanded] = useState(false)
  const qHasChildren = !!(q.children?.length)
  const qHasOptions = hasOptions(q.inputType) && !!q.options?.length

  const segChips = depth === 0 && q.scope !== undefined
    ? allConfigs.filter(c =>
        c.key === `entity:${q.scope}` ||
        c.key === `service:${q.scope}` ||
        c.key === `entity:${q.scopeEntity}` ||
        c.key === `service:${q.scopeService}`
      )
    : []

  const isOn = enabled !== false

  return (
    <>
      <div
        draggable={!!(dragProps && depth === 0)}
        onDragStart={depth === 0 ? dragProps?.onDragStart : undefined}
        onDragEnd={depth === 0 ? dragProps?.onDragEnd : undefined}
        onDragOver={depth === 0 ? dragProps?.onDragOver : undefined}
        onDrop={depth === 0 ? dragProps?.onDrop : undefined}
        className={`flex items-start gap-3 border-b border-sb-n100 last:border-0 ${depth > 0 ? 'bg-sb-n50' : 'bg-white'} ${!isOn && depth === 0 ? 'opacity-40' : ''} ${dragProps?.isDragOver && depth === 0 ? 'border-t-2 border-sb-brand' : ''}`}
        style={{ paddingLeft: `${16 + depth * 20}px`, paddingRight: '16px', paddingTop: '10px', paddingBottom: '10px' }}
      >
        <span className="flex-shrink-0 mt-0.5">
          {depth > 0
            ? <span className="text-sb-n300 font-mono text-[11px] select-none">└</span>
            : <span className="flex items-center gap-1">
                {dragProps && (
                  <span className="cursor-grab text-sb-n300 hover:text-sb-n500">
                    <DotsSixVertical size={14} />
                  </span>
                )}
                {onToggle
                  ? (
                    <span className="flex items-center gap-1">
                      <ToggleSwitch checked={isOn} onChange={onToggle} />
                      {qHasChildren && (
                        <button onClick={() => setExpanded(v => !v)} className="text-sb-n400 hover:text-sb-brand">
                          {expanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
                        </button>
                      )}
                    </span>
                  )
                  : <span className="w-4 inline-block flex-shrink-0">
                      {qHasChildren && (
                        <button onClick={() => setExpanded(v => !v)} className="text-sb-n400 hover:text-sb-brand">
                          {expanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
                        </button>
                      )}
                    </span>
                }
              </span>
          }
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-[13px] text-sb-n800 leading-snug">{q.label}</p>
            {segChips.map(c => (
              <span
                key={c.key}
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
                  c.key === currentSegKey
                    ? 'bg-sb-blue-100 border-sb-brand text-sb-brand'
                    : 'bg-sb-n50 border-sb-n200 text-sb-n500'
                }`}
              >
                {SEGMENT_LABELS[c.key] ?? c.key}
              </span>
            ))}
            {q.showWhen && (
              <span className="text-[10px] font-mono text-sb-n400 bg-sb-n50 border border-sb-n100 rounded px-1.5 py-0.5">
                if {q.showWhen.parentId} = {q.showWhen.value}
              </span>
            )}
          </div>
          <p className="text-[11px] font-mono text-sb-n400 mt-0.5">{q.id}</p>
          {qHasOptions && depth === 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {q.options!.map(opt => (
                <span key={opt.value} className="text-[11px] px-2 py-0.5 rounded-full border bg-sb-n50 border-sb-n200 text-sb-n600">
                  {opt.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {depth === 0 && (
          <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
            {q.repeat && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">반복</span>}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${q.isRequired ? 'bg-red-50 text-sb-negative' : 'bg-sb-n50 text-sb-n400'}`}>
              {q.isRequired ? '필수' : '선택'}
            </span>
            <span className="text-[10px] font-mono text-sb-n400 px-1.5 py-0.5 border border-sb-n100 rounded">{q.inputType}</span>
            {onDelete && (
              <button onClick={onDelete} className="flex items-center justify-center w-7 h-7 rounded-[6px] text-sb-n400 hover:text-sb-negative hover:bg-red-50 transition-colors">
                <Trash size={13} />
              </button>
            )}
          </div>
        )}
      </div>
      {expanded && q.children?.map(child => (
        <QuestionRowFixed key={child.id} q={child} depth={depth + 1} currentSegKey={currentSegKey} />
      ))}
    </>
  )
}

function AddOwnQuestionForm({
  parentOptions,
  commonQuestions,
  showSvcCondition,
  defaultSvcCondition,
  onAdd,
  onCancel,
}: {
  parentOptions: QuestionRule[]
  commonQuestions?: QuestionRule[]
  showSvcCondition?: boolean
  defaultSvcCondition?: 'payout' | 'collection'
  onAdd: (q: QuestionRule) => void
  onCancel?: () => void
}) {
  const [form, setForm] = useState({
    label: '',
    inputType: 'text' as QuestionInputType,
    isRequired: true,
    parentId: '',
    parentValue: '',
    svcCondition: (defaultSvcCondition ?? '') as 'payout' | 'collection' | '',
  })
  const [optionRows, setOptionRows] = useState<{ value: string; label: string }[]>([])

  const allParents = [...(commonQuestions ?? []), ...parentOptions]
  const selectedParent = form.parentId ? allParents.find(q => q.id === form.parentId) : null
  const parentOpts = selectedParent?.options ?? []
  const qHasOptionField = hasOptions(form.inputType)

  function submit() {
    if (!form.label) return
    let showWhen: { parentId: string; value: string } | undefined
    if (form.svcCondition) showWhen = { parentId: '_svc', value: form.svcCondition }
    else if (form.parentId) showWhen = { parentId: form.parentId, value: form.parentValue }
    const validOptions = optionRows.filter(o => o.value && o.label)
    const q: QuestionRule = {
      id: `q_own_${Date.now()}`,
      label: form.label,
      inputType: form.inputType,
      isRequired: form.isRequired,
      classification: 'service-own',
      ...(showWhen ? { showWhen } : {}),
      ...(validOptions.length ? { options: validOptions } : {}),
    }
    onAdd(q)
    setForm({ label: '', inputType: 'text', isRequired: true, parentId: '', parentValue: '', svcCondition: defaultSvcCondition ?? '' })
    setOptionRows([])
  }

  return (
    <div className="pt-3 border-t border-sb-n100 mt-1 flex flex-col gap-2">
      {/* FI service condition */}
      {showSvcCondition && (
        <div>
          <p className="text-[11px] text-sb-n400 mb-1">서비스 조건 (FI)</p>
          <select
            value={form.svcCondition}
            onChange={(e) => setForm(p => ({ ...p, svcCondition: e.target.value as typeof p.svcCondition, parentId: '', parentValue: '' }))}
            className="w-full text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 bg-white focus:outline-none focus:border-sb-brand text-sb-n700"
          >
            <option value="">없음 (서비스 무관)</option>
            <option value="payout">송금 전용</option>
            <option value="collection">수금 전용</option>
          </select>
        </div>
      )}

      <div className="flex items-end gap-2">
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
        {onCancel && (
          <button onClick={onCancel} className="text-[12px] text-sb-n500 hover:text-sb-n800 mb-px">취소</button>
        )}
      </div>

      {/* Options (for select / radio / multi) */}
      {qHasOptionField && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] text-sb-n400">옵션 <span className="text-sb-n300">(value / label)</span></p>
          {optionRows.map((opt, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input placeholder="value" value={opt.value} onChange={e => setOptionRows(r => r.map((o, j) => j === i ? { ...o, value: e.target.value } : o))}
                className="w-28 text-[11px] font-mono border border-sb-n200 rounded-[6px] px-2 py-1 focus:outline-none focus:border-sb-brand" />
              <input placeholder="레이블" value={opt.label} onChange={e => setOptionRows(r => r.map((o, j) => j === i ? { ...o, label: e.target.value } : o))}
                className="flex-1 text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1 focus:outline-none focus:border-sb-brand" />
              <button onClick={() => setOptionRows(r => r.filter((_, j) => j !== i))} className="text-sb-n300 hover:text-sb-negative">
                <Trash size={12} />
              </button>
            </div>
          ))}
          <button onClick={() => setOptionRows(r => [...r, { value: '', label: '' }])}
            className="flex items-center gap-1 text-[11px] text-sb-brand hover:underline self-start">
            <Plus size={11} /> 옵션 추가
          </button>
        </div>
      )}

      {/* Display condition (only when no svc condition) */}
      {!form.svcCondition && (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <p className="text-[11px] text-sb-n400 mb-1">표시 조건 (선택)</p>
            <select
              value={form.parentId}
              onChange={(e) => setForm(p => ({ ...p, parentId: e.target.value, parentValue: '' }))}
              className="w-full text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 bg-white focus:outline-none focus:border-sb-brand text-sb-n600"
            >
              <option value="">없음 (독립 질문)</option>
              {allParents.filter(pq => pq.options?.length).map(pq => (
                <option key={pq.id} value={pq.id}>[{pq.inputType}] {pq.label}</option>
              ))}
              {allParents.filter(pq => !pq.options?.length).map(pq => (
                <option key={pq.id} value={pq.id}>{pq.label}</option>
              ))}
            </select>
          </div>
          {form.parentId && (
            <div className="w-36">
              <p className="text-[11px] text-sb-n400 mb-1">트리거 값</p>
              {parentOpts.length > 0 ? (
                <select
                  value={form.parentValue}
                  onChange={(e) => setForm(p => ({ ...p, parentValue: e.target.value }))}
                  className="w-full text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 bg-white focus:outline-none focus:border-sb-brand"
                >
                  <option value="">선택</option>
                  {parentOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input
                  placeholder="예: joint"
                  value={form.parentValue}
                  onChange={(e) => setForm(p => ({ ...p, parentValue: e.target.value }))}
                  className="w-full text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 text-sb-n800 focus:outline-none focus:border-sb-brand"
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── 1차 인테이크 질문 에디터 ──────────────────────────────────────────────────

function FirstQuestionsEditor() {
  const { currentRuleSet, updateRuleSet } = useRuleStore()
  const rs = getRuleSet()
  const questions: FirstIntakeQuestion[] = (rs.firstIntakeQuestions ?? []) as FirstIntakeQuestion[]

  const [addLabel, setAddLabel] = useState('')
  const [addType, setAddType] = useState<QuestionInputType>('text')
  const [addRequired, setAddRequired] = useState(false)
  const [dragSrc, setDragSrc] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  function save(next: FirstIntakeQuestion[]) {
    updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), firstIntakeQuestions: next })
  }

  function toggleEnabled(id: string) {
    save(questions.map(q => q.id === id ? { ...q, enabled: !q.enabled } : q))
  }

  function removeQuestion(id: string) {
    if (!window.confirm('이 질문을 삭제하시겠습니까?')) return
    save(questions.filter(q => q.id !== id))
  }

  function reorderFirst(from: number, to: number) {
    const next = [...questions]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    save(next)
  }

  function addQuestion() {
    if (!addLabel.trim()) return
    const newQ: FirstIntakeQuestion = {
      id: `fi_custom_${Date.now()}`,
      label: addLabel.trim(),
      inputType: addType,
      isRequired: addRequired,
      classification: 'common',
      enabled: true,
    }
    save([...questions, newQ])
    setAddLabel('')
    setAddType('text')
    setAddRequired(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[12px] text-sb-n500 mb-3">모든 고객이 세그먼트 분류 전에 작성하는 인테이크 폼입니다. 여기서 받은 값으로 세그먼트가 결정됩니다.</p>
        <div className="bg-white rounded-[12px] border border-sb-n100 overflow-hidden">
          {questions.map((q, idx) => {
            const qHasOpts = hasOptions(q.inputType) && !!q.options?.length
            const isOver = dragOver === idx && dragSrc !== idx

            return (
              <div
                key={q.id}
                draggable
                onDragStart={() => setDragSrc(idx)}
                onDragEnd={() => { setDragSrc(null); setDragOver(null) }}
                onDragOver={e => { e.preventDefault(); setDragOver(idx) }}
                onDrop={() => { if (dragSrc !== null && dragSrc !== idx) reorderFirst(dragSrc, idx); setDragSrc(null); setDragOver(null) }}
                className={`flex items-start gap-3 px-4 py-3 ${!q.enabled ? 'opacity-40' : ''} ${isOver ? 'border-t-2 border-sb-brand' : 'border-b border-sb-n100 last:border-0'}`}
              >
                <span className="flex-shrink-0 mt-1 cursor-grab text-sb-n300 hover:text-sb-n500">
                  <DotsSixVertical size={14} />
                </span>
                <span className="flex-shrink-0 mt-0.5">
                  <ToggleSwitch checked={q.enabled} onChange={() => toggleEnabled(q.id)} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-[13px] text-sb-n800 leading-snug">{q.label}</p>
                    {q.hint && (
                      <span className="text-[10px] font-mono text-sb-n400 bg-sb-n50 border border-sb-n100 rounded px-1.5 py-0.5">{q.hint}</span>
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-sb-n400 mt-0.5">{q.id}</p>
                  {qHasOpts && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {q.options!.map(opt => (
                        <span key={opt.value} className="text-[11px] px-2 py-0.5 rounded-full border bg-sb-n50 border-sb-n200 text-sb-n600">
                          {opt.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${q.isRequired ? 'bg-red-50 text-sb-negative' : 'bg-sb-n50 text-sb-n400'}`}>
                    {q.isRequired ? '필수' : '선택'}
                  </span>
                  <span className="text-[10px] font-mono text-sb-n400 px-1.5 py-0.5 border border-sb-n100 rounded">{q.inputType}</span>
                  {!q.isFixed && (
                    <button onClick={() => removeQuestion(q.id)} className="flex items-center justify-center w-7 h-7 rounded-[6px] text-sb-n400 hover:text-sb-negative hover:bg-red-50 transition-colors">
                      <Trash size={13} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add form */}
          <div className="px-4 py-3 bg-sb-n50 flex flex-col gap-2">
            <p className="text-[11px] font-semibold text-sb-n500">질문 추가</p>
            <div className="flex items-center gap-2">
              <input
                placeholder="레이블 입력"
                value={addLabel}
                onChange={e => setAddLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addQuestion()}
                className="flex-1 text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 focus:outline-none focus:border-sb-brand bg-white"
              />
              <select value={addType} onChange={e => setAddType(e.target.value as QuestionInputType)}
                className="text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 bg-white focus:outline-none focus:border-sb-brand w-24">
                {INPUT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={addRequired} onChange={e => setAddRequired(e.target.checked)} className="rounded border-sb-n300 text-sb-brand" />
                <span className="text-[12px] text-sb-n600">필수</span>
              </label>
              <button onClick={addQuestion} disabled={!addLabel.trim()}
                className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-[12px] font-medium bg-sb-brand text-white disabled:opacity-40">
                <Plus size={12} /> 추가
              </button>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-sb-n400">버전: <span className="font-mono font-medium text-sb-n700">{currentRuleSet.version}</span></p>
    </div>
  )
}

function QuestionsEditor({ selected }: { selected: Selection }) {
  const { currentRuleSet, updateRuleSet } = useRuleStore()
  const [svcView, setSvcView] = useState<'all' | 'payout' | 'collection'>('all')
  const [commonOpen, setCommonOpen] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showAddCommonForm, setShowAddCommonForm] = useState(false)
  const [dragCommonSrc, setDragCommonSrc] = useState<number | null>(null)
  const [dragCommonOver, setDragCommonOver] = useState<number | null>(null)
  const [dragFixedSrc, setDragFixedSrc] = useState<number | null>(null)
  const [dragFixedOver, setDragFixedOver] = useState<number | null>(null)
  const [dragConfigSrc, setDragConfigSrc] = useState<number | null>(null)
  const [dragConfigOver, setDragConfigOver] = useState<number | null>(null)

  const isFI = selected.type === 'entity' && selected.code === 'ENTITY_FI'
  const isCollection = selected.type === 'service' && COLLECTION_CODES.has(selected.code)
  const configKey = selected.type === 'entity'
    ? `entity:${selected.code}`
    : selected.type === 'service'
      ? `service:${selected.code}`
      : ''
  const rs = getRuleSet()

  const config: SegmentQuestionConfig = rs.segmentQuestionConfigs.find(c => c.key === configKey)
    ?? { key: configKey, enabledCommonQuestionIds: [], ownQuestions: [] }

  const allConfigs = rs.segmentQuestionConfigs
  const commonQuestions = rs.questionPool.filter(q => q.classification === 'common')
  const ownFixedQuestions = rs.questionPool.filter(q => {
    if (selected.type === 'entity') return q.classification === 'entity-own' && (q.scope === selected.code || q.scopeEntity === selected.code)
    if (selected.type === 'service') return q.classification === 'service-own' && (q.scope === selected.code || q.scopeService === selected.code)
    return false
  })

  function saveConfig(patch: Partial<SegmentQuestionConfig>) {
    const fullRs = getRuleSet()
    const exists = fullRs.segmentQuestionConfigs.some(c => c.key === configKey)
    const updated: SegmentQuestionConfig[] = exists
      ? fullRs.segmentQuestionConfigs.map(c => c.key === configKey ? { ...c, ...patch } : c)
      : [...fullRs.segmentQuestionConfigs, { ...config, ...patch }]
    updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), segmentQuestionConfigs: updated, questionPool: fullRs.questionPool })
  }

  function addOwn(q: QuestionRule) {
    saveConfig({ ownQuestions: [...config.ownQuestions, q] })
    setShowAddForm(false)
  }

  function removeOwn(idx: number) {
    if (!window.confirm('이 질문을 삭제하시겠습니까?')) return
    saveConfig({ ownQuestions: config.ownQuestions.filter((_, i) => i !== idx) })
  }

  function deleteCommonQuestion(q: QuestionRule) {
    const fullRs = getRuleSet()
    const mappedCount = fullRs.segmentQuestionConfigs.filter(c => c.enabledCommonQuestionIds.includes(q.id)).length
    const msg = mappedCount > 1
      ? `"${q.label}" 질문을 이 세그먼트에서만 해제합니다. 다른 ${mappedCount - 1}개 세그먼트에는 유지됩니다.\n계속하시겠습니까?`
      : `"${q.label}" 질문을 라이브러리에서 완전히 삭제합니다. 하위 질문도 함께 삭제됩니다.\n계속하시겠습니까?`
    if (!window.confirm(msg)) return
    if (mappedCount > 1) {
      const updatedConfigs = fullRs.segmentQuestionConfigs.map(c =>
        c.key === configKey
          ? { ...c, enabledCommonQuestionIds: c.enabledCommonQuestionIds.filter(id => id !== q.id) }
          : c
      )
      updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), questionPool: fullRs.questionPool, segmentQuestionConfigs: updatedConfigs })
    } else {
      const updatedPool = fullRs.questionPool.filter(pq => pq.id !== q.id)
      const updatedConfigs = fullRs.segmentQuestionConfigs.map(c => ({
        ...c, enabledCommonQuestionIds: c.enabledCommonQuestionIds.filter(id => id !== q.id),
      }))
      updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), questionPool: updatedPool, segmentQuestionConfigs: updatedConfigs })
    }
  }

  function deletePoolOwnQuestion(q: QuestionRule) {
    if (!window.confirm(`"${q.label}" 질문을 삭제합니다. 하위 질문도 함께 삭제됩니다.\n계속하시겠습니까?`)) return
    const fullRs = getRuleSet()
    const updatedPool = fullRs.questionPool.filter(pq => pq.id !== q.id)
    const updatedConfigs = fullRs.segmentQuestionConfigs.map(c => ({
      ...c,
      disabledOwnQuestionIds: (c.disabledOwnQuestionIds ?? []).filter(id => id !== q.id),
    }))
    updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), questionPool: updatedPool, segmentQuestionConfigs: updatedConfigs })
  }

  function reorderCommon(from: number, to: number) {
    const fullRs = getRuleSet()
    const pool = [...fullRs.questionPool]
    const allCommon = pool.filter(q => q.classification === 'common')
    const fromPoolIdx = pool.findIndex(q => q.id === allCommon[from].id)
    const toPoolIdx = pool.findIndex(q => q.id === allCommon[to].id)
    const [item] = pool.splice(fromPoolIdx, 1)
    pool.splice(toPoolIdx, 0, item)
    updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), questionPool: pool, segmentQuestionConfigs: fullRs.segmentQuestionConfigs })
  }

  function reorderFixed(from: number, to: number) {
    const fullRs = getRuleSet()
    const pool = [...fullRs.questionPool]
    const visible = ownFixedQuestions.filter(matchesSvcView)
    const fromPoolIdx = pool.findIndex(q => q.id === visible[from].id)
    const toPoolIdx = pool.findIndex(q => q.id === visible[to].id)
    const [item] = pool.splice(fromPoolIdx, 1)
    pool.splice(toPoolIdx, 0, item)
    updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), questionPool: pool, segmentQuestionConfigs: fullRs.segmentQuestionConfigs })
  }

  function reorderConfigOwn(from: number, to: number) {
    const visible = config.ownQuestions.filter(matchesSvcView)
    const own = [...config.ownQuestions]
    const fromIdx = own.findIndex(q => q.id === visible[from].id)
    const toIdx = own.findIndex(q => q.id === visible[to].id)
    const [item] = own.splice(fromIdx, 1)
    own.splice(toIdx, 0, item)
    saveConfig({ ownQuestions: own })
  }

  function addCommonQuestion(q: QuestionRule, segmentKeys: string[]) {
    const fullRs = getRuleSet()
    const configuredKeys = new Set(fullRs.segmentQuestionConfigs.map(c => c.key))
    const updatedConfigs = fullRs.segmentQuestionConfigs.map(cfg =>
      segmentKeys.includes(cfg.key)
        ? { ...cfg, enabledCommonQuestionIds: [...cfg.enabledCommonQuestionIds, q.id] }
        : cfg
    )
    const newConfigs: SegmentQuestionConfig[] = [
      ...updatedConfigs,
      ...segmentKeys.filter(k => !configuredKeys.has(k)).map(k => ({
        key: k, enabledCommonQuestionIds: [q.id], ownQuestions: [] as QuestionRule[],
      })),
    ]
    updateRuleSet({
      ...currentRuleSet,
      version: nextVersion(currentRuleSet.version),
      questionPool: [...fullRs.questionPool, q],
      segmentQuestionConfigs: newConfigs,
    })
    setShowAddCommonForm(false)
  }

  function isOwnEnabled(id: string): boolean {
    return !(config.disabledOwnQuestionIds ?? []).includes(id)
  }

  function toggleOwn(id: string) {
    const disabled = config.disabledOwnQuestionIds ?? []
    const next = disabled.includes(id) ? disabled.filter(x => x !== id) : [...disabled, id]
    saveConfig({ disabledOwnQuestionIds: next.length ? next : undefined })
  }

  const allOwnForParent = [...ownFixedQuestions, ...config.ownQuestions]

  function matchesSvcView(q: QuestionRule): boolean {
    if (svcView === 'all') return true
    const cond = q.showWhen?.parentId === '_svc' ? q.showWhen.value : null
    if (!cond) return true
    return cond === svcView
  }

  const segmentCode = selected.type === 'entity' ? selected.code : selected.type === 'service' ? selected.code : ''
  const screen1LastOwn = SCREEN1_LAST_ID[segmentCode] ?? ''

  return (
    <div className="flex flex-col gap-5">
      {/* Collection FI-inheritance banner */}
      {isCollection && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-[10px] bg-blue-50 border border-blue-100">
          <span className="text-sb-brand flex-shrink-0 mt-0.5 text-[15px] font-bold leading-none">ℹ</span>
          <p className="text-[12px] text-blue-800">
            이 고객은 <strong>FI 질문 전체 + 아래 통화 고유 질문</strong>을 받습니다 (수금=FI).
            FI 공통 질문은 <strong>FI 세그먼트</strong>에서 관리하고, 여기서는 통화 고유 질문만 추가합니다.
          </p>
        </div>
      )}

      {/* 공통 질문 — collapsible, enable/disable + option filter per segment */}
      <div>
        <button
          onClick={() => setCommonOpen(v => !v)}
          className="flex items-center gap-2 w-full mb-2 group"
        >
          <span className={`transition-transform ${commonOpen ? 'rotate-0' : '-rotate-90'}`}>
            <CaretDown size={12} className="text-sb-n500" />
          </span>
          <span className="text-[12px] font-semibold text-sb-n700">공통 질문 (2차)</span>
          <span className="text-[12px] text-sb-n400">{commonQuestions.length}</span>
          <span className="text-[12px] text-sb-n400">· 전 세그먼트 자동 적용</span>
        </button>
        {commonOpen && (
          <div className="bg-white rounded-[10px] border border-sb-n100 overflow-hidden">
            {commonQuestions.length === 0 && !showAddCommonForm && (
              <p className="text-[12px] text-sb-n400 px-4 py-3">공통 질문 없음</p>
            )}
            {commonQuestions.map((q, cidx) => (
              <CommonQuestionRow
                key={q.id}
                q={q}
                enabled={config.enabledCommonQuestionIds.includes(q.id)}
                optionFilter={config.commonOptionFilters?.[q.id]}
                dragProps={{
                  onDragStart: () => setDragCommonSrc(cidx),
                  onDragEnd: () => { setDragCommonSrc(null); setDragCommonOver(null) },
                  onDragOver: e => { e.preventDefault(); setDragCommonOver(cidx) },
                  onDrop: () => { if (dragCommonSrc !== null && dragCommonSrc !== cidx) reorderCommon(dragCommonSrc, cidx); setDragCommonSrc(null); setDragCommonOver(null) },
                  isDragOver: dragCommonOver === cidx && dragCommonSrc !== cidx,
                }}
                onToggle={() => {
                  const ids = config.enabledCommonQuestionIds.includes(q.id)
                    ? config.enabledCommonQuestionIds.filter(id => id !== q.id)
                    : [...config.enabledCommonQuestionIds, q.id]
                  saveConfig({ enabledCommonQuestionIds: ids })
                }}
                onFilterChange={(values) => {
                  const current = config.commonOptionFilters ?? {}
                  const next = { ...current }
                  if (values === undefined) delete next[q.id]
                  else next[q.id] = values
                  saveConfig({ commonOptionFilters: Object.keys(next).length ? next : undefined })
                }}
                onDelete={() => deleteCommonQuestion(q)}
              />
            ))}
            {showAddCommonForm ? (
              <AddCommonQuestionForm
                onAdd={addCommonQuestion}
                onCancel={() => setShowAddCommonForm(false)}
              />
            ) : (
              <div className="px-4 py-2.5 border-t border-sb-n100">
                <button
                  onClick={() => { setShowAddCommonForm(true); setShowAddForm(false) }}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-sb-brand hover:underline"
                >
                  <Plus size={12} />
                  질문 추가
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FI 서비스 뷰 탭 */}
      {isFI && (
        <div>
          <p className="text-[12px] font-semibold text-sb-n700 mb-2">서비스 뷰 (FI)</p>
          <div className="flex border border-sb-n100 rounded-[8px] overflow-hidden bg-white text-[12px]">
            {(['all', 'payout', 'collection'] as const).map((v, i) => (
              <button
                key={v}
                onClick={() => { setSvcView(v); setShowAddForm(false) }}
                className={`flex-1 py-2 font-medium transition-colors ${i > 0 ? 'border-l border-sb-n100' : ''} ${svcView === v ? 'bg-sb-brand text-white' : 'text-sb-n500 hover:bg-sb-n50'}`}
              >
                {v === 'all' ? '전체' : v === 'payout' ? '송금' : '수금'}
              </button>
            ))}
          </div>
          {svcView !== 'all' && (
            <p className="text-[11px] text-sb-n400 mt-1.5">
              {svcView === 'payout' ? '송금' : '수금'} 서비스 고객에게만 표시되는 질문. 서비스 조건 없는 질문은 항상 표시됩니다.
            </p>
          )}
        </div>
      )}

      {/* 고유 질문 */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[12px] font-semibold text-sb-n700">이 세그먼트 질문</p>
          <span className="text-[12px] text-sb-n400">· 고유 + 공유(다중 매핑)</span>
        </div>
        <div className="bg-white rounded-[10px] border border-sb-n100 overflow-hidden">
          {ownFixedQuestions.filter(matchesSvcView).length === 0 && config.ownQuestions.filter(matchesSvcView).length === 0 && (
            <p className="text-[12px] text-sb-n400 px-4 py-3">고유 질문 없음</p>
          )}
          {screen1LastOwn && ownFixedQuestions.filter(matchesSvcView).length > 0 && (
            <ScreenDivider n={1} />
          )}
          {ownFixedQuestions.filter(matchesSvcView).map((q, idx) => (
            <Fragment key={q.id}>
              <QuestionRowFixed
                q={q}
                allConfigs={allConfigs}
                currentSegKey={configKey}
                enabled={isOwnEnabled(q.id)}
                onToggle={() => toggleOwn(q.id)}
                onDelete={() => deletePoolOwnQuestion(q)}
                dragProps={{
                  onDragStart: () => setDragFixedSrc(idx),
                  onDragEnd: () => { setDragFixedSrc(null); setDragFixedOver(null) },
                  onDragOver: e => { e.preventDefault(); setDragFixedOver(idx) },
                  onDrop: () => { if (dragFixedSrc !== null && dragFixedSrc !== idx) reorderFixed(dragFixedSrc, idx); setDragFixedSrc(null); setDragFixedOver(null) },
                  isDragOver: dragFixedOver === idx && dragFixedSrc !== idx,
                }}
              />
              {q.id === screen1LastOwn && <ScreenDivider n={2} />}
            </Fragment>
          ))}
          {(() => {
            const visibleConfigOwn = config.ownQuestions.filter(matchesSvcView)
            return config.ownQuestions.map((q, i) => {
              if (!matchesSvcView(q)) return null
              const qHasOpts = hasOptions(q.inputType) && !!q.options?.length
              const visIdx = visibleConfigOwn.findIndex(vq => vq.id === q.id)
              const isOver = dragConfigOver === visIdx && dragConfigSrc !== visIdx

              return (
                <div
                  key={q.id}
                  draggable
                  onDragStart={() => setDragConfigSrc(visIdx)}
                  onDragEnd={() => { setDragConfigSrc(null); setDragConfigOver(null) }}
                  onDragOver={e => { e.preventDefault(); setDragConfigOver(visIdx) }}
                  onDrop={() => { if (dragConfigSrc !== null && dragConfigSrc !== visIdx) reorderConfigOwn(dragConfigSrc, visIdx); setDragConfigSrc(null); setDragConfigOver(null) }}
                  className={`flex items-start gap-3 px-4 py-3 ${!isOwnEnabled(q.id) ? 'opacity-40' : ''} ${isOver ? 'border-t-2 border-sb-brand' : 'border-t border-sb-n100'}`}
                >
                  <span className="flex-shrink-0 mt-1 cursor-grab text-sb-n300 hover:text-sb-n500">
                    <DotsSixVertical size={14} />
                  </span>
                  <span className="flex-shrink-0 mt-0.5">
                    <ToggleSwitch checked={isOwnEnabled(q.id)} onChange={() => toggleOwn(q.id)} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-[13px] text-sb-n800">{q.label}</p>
                      {q.showWhen?.parentId === '_svc' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sb-blue-100 text-sb-brand">
                          {q.showWhen.value === 'payout' ? '송금' : '수금'}
                        </span>
                      )}
                      {q.showWhen && q.showWhen.parentId !== '_svc' && (
                        <span className="text-[10px] font-mono text-sb-n400 bg-sb-n50 border border-sb-n100 rounded px-1.5 py-0.5">
                          if {q.showWhen.parentId} = {q.showWhen.value}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-sb-n400 mt-0.5">{q.id}</p>
                    {qHasOpts && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {q.options!.map(opt => (
                          <span key={opt.value} className="text-[11px] px-2 py-0.5 rounded-full border bg-sb-n50 border-sb-n200 text-sb-n600">
                            {opt.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${q.isRequired ? 'bg-red-50 text-sb-negative' : 'bg-sb-n50 text-sb-n400'}`}>
                      {q.isRequired ? '필수' : '선택'}
                    </span>
                    <span className="text-[10px] font-mono text-sb-n400 px-1.5 py-0.5 border border-sb-n100 rounded">{q.inputType}</span>
                    <button onClick={() => removeOwn(i)} className="flex items-center justify-center w-7 h-7 rounded-[6px] text-sb-n400 hover:text-sb-negative hover:bg-red-50 transition-colors">
                      <Trash size={13} />
                    </button>
                  </div>
                </div>
              )
            })
          })()}
          {/* Add form — shown only when button clicked */}
          {showAddForm ? (
            <div className="border-t border-sb-n100 px-4 py-3 bg-sb-n50">
              <AddOwnQuestionForm
                key={svcView}
                parentOptions={allOwnForParent}
                commonQuestions={commonQuestions}
                showSvcCondition={isFI}
                defaultSvcCondition={isFI && svcView !== 'all' ? svcView : undefined}
                onAdd={addOwn}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          ) : (
            <div className="px-4 py-2.5 border-t border-sb-n100">
              <button
                onClick={() => { setShowAddForm(true); setShowAddCommonForm(false) }}
                className="flex items-center gap-1.5 text-[12px] font-medium text-sb-brand hover:underline"
              >
                <Plus size={12} />
                질문 추가
              </button>
            </div>
          )}
        </div>
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

function DocLibraryRow({ doc, enabled, override, onToggle, isEditingOverride, overrideInput, onOverrideInputChange, onStartOverride, onSaveOverride, onCancelOverride }: {
  doc: DocLibraryItem
  enabled: boolean
  override?: { displayName?: string }
  onToggle: () => void
  isEditingOverride: boolean
  overrideInput: string
  onOverrideInputChange: (s: string) => void
  onStartOverride: () => void
  onSaveOverride: () => void
  onCancelOverride: () => void
}) {
  if (isEditingOverride) {
    return (
      <div className="border-b border-sb-n100 last:border-0 px-4 py-3">
        <p className="text-[11px] font-mono text-sb-n400 mb-2">{doc.type}</p>
        <div className="flex flex-col gap-2 bg-sb-blue-50 rounded-[8px] border border-sb-blue-200 px-3 py-2.5">
          <input
            autoFocus
            value={overrideInput}
            onChange={e => onOverrideInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onSaveOverride(); if (e.key === 'Escape') onCancelOverride() }}
            placeholder={doc.displayName}
            className="w-full text-[13px] border border-sb-brand rounded-[6px] px-2 py-1.5 bg-white focus:outline-none"
          />
          <p className="text-[11px] text-sb-n400">비워두면 기본 displayName으로 복원</p>
          <div className="flex gap-2">
            <button onClick={onSaveOverride} className="text-[12px] font-medium text-white bg-sb-brand px-3 py-1.5 rounded-[6px]">저장</button>
            <button onClick={onCancelOverride} className="text-[12px] text-sb-n500 hover:text-sb-n800 px-2 py-1.5">취소</button>
          </div>
        </div>
      </div>
    )
  }
  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b border-sb-n100 last:border-0 ${!enabled ? 'opacity-40' : ''}`}>
      <span className="flex-shrink-0 mt-0.5">
        <ToggleSwitch checked={enabled} onChange={onToggle} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-sb-n800">{override?.displayName ?? doc.displayName}</p>
        {override?.displayName && (
          <p className="text-[11px] text-sb-n400 line-through mt-0.5">{doc.displayName}</p>
        )}
        <p className="text-[11px] font-mono text-sb-n400 mt-0.5">{doc.type}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        {override?.displayName && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">오버라이드</span>
        )}
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${doc.isRequired && !doc.isConditional ? 'bg-red-50 text-sb-negative' : 'bg-sb-n50 text-sb-n400'}`}>
          {doc.isRequired && !doc.isConditional ? '필수' : '조건부'}
        </span>
        <button onClick={onStartOverride} className="flex items-center justify-center w-7 h-7 rounded-[6px] text-sb-n400 hover:text-sb-brand hover:bg-sb-blue-100 transition-colors">
          <CaretDown size={13} className="rotate-90" />
        </button>
      </div>
    </div>
  )
}

function DocumentsEditor({ selected }: { selected: Selection }) {
  if (selected.type === 'intake') return null

  const selCode = selected.code  // narrowed: entity | service only from here

  const { currentRuleSet, updateRuleSet } = useRuleStore()
  const rs = getRuleSet()   // use getRuleSet() so docLibrary/segmentDocConfigs fall back to INITIAL_RULESET
  const docLib = rs.docLibrary ?? []
  const segDocConfigs = rs.segmentDocConfigs ?? []

  const configKey = selected.type === 'entity'
    ? `entity:${selCode as EntityCode}`
    : `service:${selCode as ServiceCode}`

  const config: DocSegmentConfig = segDocConfigs.find(c => c.key === configKey)
    ?? { key: configKey, enabledCommonDocTypes: [], ownDocs: [] }

  const commonDocs = docLib.filter(d => d.classification === 'common')
  const ownFixedDocs = docLib.filter(d => d.classification !== 'common' && d.scope === selCode)

  const [editOverrideType, setEditOverrideType] = useState<string | null>(null)
  const [editOverrideName, setEditOverrideName] = useState('')
  const [addDocForm, setAddDocForm] = useState<{ type: string; displayName: string; isRequired: boolean; isConditional: boolean } | null>(null)

  const segLabel = selected.type === 'entity'
    ? rs.entityLabels[selected.code as EntityCode]
    : rs.serviceLabels[selCode as ServiceCode]

  const hasKRWSectors = selected.type === 'service' && selCode === 'SVC_COL_KRW'

  function saveSegConfig(patch: Partial<DocSegmentConfig>) {
    const latest = getRuleSet()
    const latestConfigs = latest.segmentDocConfigs ?? []
    const exists = latestConfigs.some(c => c.key === configKey)
    const updated: DocSegmentConfig[] = exists
      ? latestConfigs.map(c => c.key === configKey ? { ...c, ...patch } : c)
      : [...latestConfigs, { ...config, ...patch }]
    updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), segmentDocConfigs: updated, docLibrary: latest.docLibrary })
  }

  function toggleCommon(type: string) {
    const enabled = config.enabledCommonDocTypes
    saveSegConfig({ enabledCommonDocTypes: enabled.includes(type) ? enabled.filter(t => t !== type) : [...enabled, type] })
  }

  function isOwnEnabled(type: string) {
    return !(config.disabledOwnDocTypes ?? []).includes(type)
  }

  function toggleOwn(type: string) {
    const disabled = config.disabledOwnDocTypes ?? []
    const next = disabled.includes(type) ? disabled.filter(t => t !== type) : [...disabled, type]
    saveSegConfig({ disabledOwnDocTypes: next.length ? next : undefined })
  }

  function startOverride(type: string) {
    setEditOverrideType(type)
    setEditOverrideName(config.commonOverrides?.[type]?.displayName ?? '')
  }

  function saveOverride(type: string) {
    const current = config.commonOverrides ?? {}
    const trimmed = editOverrideName.trim()
    let next: typeof current
    if (trimmed) {
      next = { ...current, [type]: { ...current[type], displayName: trimmed } }
    } else {
      next = { ...current }
      delete next[type]
    }
    saveSegConfig({ commonOverrides: Object.keys(next).length ? next : undefined })
    setEditOverrideType(null)
  }

  function addOwnDoc() {
    if (!addDocForm || !addDocForm.type.trim() || !addDocForm.displayName.trim()) return
    const newDoc: DocLibraryItem = {
      type: addDocForm.type.trim().toUpperCase().replace(/\s+/g, '_'),
      displayName: addDocForm.displayName.trim(),
      isRequired: addDocForm.isRequired,
      isConditional: addDocForm.isConditional,
      classification: selected.type === 'entity' ? 'entity-own' : 'service-own',
      scope: selCode as EntityCode | ServiceCode,
    }
    saveSegConfig({ ownDocs: [...config.ownDocs, newDoc] })
    setAddDocForm(null)
  }

  function updateSectorDocs(sector: SectorCode, updater: (docs: DocTemplateRule[]) => DocTemplateRule[]) {
    const svcCode = selCode as ServiceCode
    const updated = rs.documentRules.map(rule => {
      if (rule.match.service !== svcCode || rule.match.sector !== sector || rule.match.entity) return rule
      return { ...rule, docs: updater(rule.docs) }
    })
    updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), documentRules: updated })
  }

  const DOC_HEADER = (
    <div className="grid grid-cols-[1fr_110px_80px_32px] gap-2 border-b border-sb-n100 pb-1 mb-1">
      <span className="text-[11px] text-sb-n400">displayName</span>
      <span className="text-[11px] text-sb-n400">type</span>
      <span className="text-[11px] text-sb-n400">필수 여부</span>
      <span />
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* 공통 서류 */}
      <div>
        <p className="text-[12px] font-semibold text-sb-n700 mb-2">공통 서류 — {segLabel}</p>
        {commonDocs.length === 0 ? (
          <p className="text-[12px] text-sb-n400">공통 서류 라이브러리가 비어 있습니다.</p>
        ) : (
          <div className="bg-white rounded-[10px] border border-sb-n100 overflow-hidden">
            {commonDocs.map(doc => (
              <DocLibraryRow
                key={doc.type}
                doc={doc}
                enabled={config.enabledCommonDocTypes.includes(doc.type)}
                override={config.commonOverrides?.[doc.type]}
                onToggle={() => toggleCommon(doc.type)}
                isEditingOverride={editOverrideType === doc.type}
                overrideInput={editOverrideName}
                onOverrideInputChange={setEditOverrideName}
                onStartOverride={() => startOverride(doc.type)}
                onSaveOverride={() => saveOverride(doc.type)}
                onCancelOverride={() => setEditOverrideType(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 고유 서류 (라이브러리) */}
      {ownFixedDocs.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-sb-n700 mb-2">고유 서류</p>
          <div className="bg-white rounded-[10px] border border-sb-n100 overflow-hidden">
            {ownFixedDocs.map(doc => {
              const on = isOwnEnabled(doc.type)
              return (
                <div key={doc.type} className={`flex items-start gap-3 px-4 py-3 border-b border-sb-n100 last:border-0 ${!on ? 'opacity-40' : ''}`}>
                  <span className="flex-shrink-0 mt-0.5">
                    <ToggleSwitch checked={on} onChange={() => toggleOwn(doc.type)} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-sb-n800">{doc.displayName}</p>
                    <p className="text-[11px] font-mono text-sb-n400 mt-0.5">{doc.type}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${doc.isRequired && !doc.isConditional ? 'bg-red-50 text-sb-negative' : 'bg-sb-n50 text-sb-n400'}`}>
                    {doc.isRequired && !doc.isConditional ? '필수' : '조건부'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* KRW 섹터 조건부 서류 (기존 documentRules 유지) */}
      {hasKRWSectors && (
        <div className="flex flex-col gap-3">
          <p className="text-[12px] font-semibold text-sb-n700">섹터 조건부 서류</p>
          {SECTOR_ORDER.map(sector => {
            const sectorRule = rs.documentRules.find(r => r.match.service === selCode && r.match.sector === sector)
            const sectorDocs = sectorRule?.docs ?? []
            return (
              <div key={sector} className="bg-white rounded-[10px] border border-sb-n100 p-4">
                <p className="text-[12px] font-semibold text-sb-n500 uppercase tracking-[0.5px] mb-3">
                  <span className="font-mono">{sector}</span> — {rs.sectorLabels[sector]}
                </p>
                {DOC_HEADER}
                <DocList
                  docs={sectorDocs}
                  onUpdate={(i, patch) => updateSectorDocs(sector, d => d.map((doc, idx) => idx === i ? { ...doc, ...patch } : doc))}
                  onRemove={(i) => updateSectorDocs(sector, d => d.filter((_, idx) => idx !== i))}
                />
                <AddDocForm onAdd={(doc) => {
                  if (sectorRule) {
                    updateSectorDocs(sector, d => [...d, doc])
                  } else {
                    const newRule = { match: { service: selCode as ServiceCode, sector }, docs: [doc] }
                    updateRuleSet({ ...currentRuleSet, version: nextVersion(currentRuleSet.version), documentRules: [...rs.documentRules, newRule] })
                  }
                }} />
              </div>
            )
          })}
        </div>
      )}

      {/* 추가 서류 (ad-hoc) */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[12px] font-semibold text-sb-n700">추가 서류</p>
          <span className="text-[12px] text-sb-n400">· 직접 추가</span>
        </div>
        <div className="bg-white rounded-[10px] border border-sb-n100 overflow-hidden">
          {config.ownDocs.length === 0 && !addDocForm && (
            <p className="text-[12px] text-sb-n400 px-4 py-3">추가 서류 없음</p>
          )}
          {config.ownDocs.map((doc, i) => (
            <div key={doc.type + i} className="flex items-start gap-3 px-4 py-3 border-b border-sb-n100 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-sb-n800">{doc.displayName}</p>
                <p className="text-[11px] font-mono text-sb-n400 mt-0.5">{doc.type}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${doc.isRequired && !doc.isConditional ? 'bg-red-50 text-sb-negative' : 'bg-sb-n50 text-sb-n400'}`}>
                  {doc.isRequired && !doc.isConditional ? '필수' : '조건부'}
                </span>
                <button onClick={() => saveSegConfig({ ownDocs: config.ownDocs.filter((_, j) => j !== i) })}
                  className="flex items-center justify-center w-7 h-7 rounded-[6px] text-sb-n400 hover:text-sb-negative hover:bg-red-50 transition-colors">
                  <Trash size={13} />
                </button>
              </div>
            </div>
          ))}
          {addDocForm ? (
            <div className="border-t border-sb-n100 px-4 py-3 bg-sb-n50 flex flex-col gap-2">
              <div className="flex gap-2">
                <input value={addDocForm.type} onChange={e => setAddDocForm(f => f && { ...f, type: e.target.value })}
                  placeholder="type (예: MY_DOC)" className="w-36 text-[12px] font-mono border border-sb-n200 rounded-[6px] px-2 py-1.5 bg-white focus:outline-none focus:border-sb-brand" />
                <input value={addDocForm.displayName} onChange={e => setAddDocForm(f => f && { ...f, displayName: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && addOwnDoc()}
                  placeholder="표시명" className="flex-1 text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 bg-white focus:outline-none focus:border-sb-brand" />
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={addDocForm.isRequired} onChange={e => setAddDocForm(f => f && { ...f, isRequired: e.target.checked })} className="rounded" />
                  <span className="text-[12px] text-sb-n600">필수</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={addDocForm.isConditional} onChange={e => setAddDocForm(f => f && { ...f, isConditional: e.target.checked })} className="rounded" />
                  <span className="text-[12px] text-sb-n600">조건부</span>
                </label>
                <button onClick={addOwnDoc} disabled={!addDocForm.type.trim() || !addDocForm.displayName.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-[12px] font-medium bg-sb-brand text-white disabled:opacity-40">
                  <Plus size={12} /> 추가
                </button>
                <button onClick={() => setAddDocForm(null)} className="text-[12px] text-sb-n500 hover:text-sb-n800">취소</button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2.5 border-t border-sb-n100">
              <button onClick={() => setAddDocForm({ type: '', displayName: '', isRequired: true, isConditional: false })}
                className="flex items-center gap-1.5 text-[12px] font-medium text-sb-brand hover:underline">
                <Plus size={12} /> 서류 추가
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-sb-n400">
        버전: <span className="font-mono font-medium text-sb-n700">{rs.version}</span>
      </p>
    </div>
  )
}

// ── Entity classification table editor ────────────────────────────────────────

type RowBusinessType = 'financial' | 'corporation' | 'individual' | 'any'
type RowFoundingCountry = 'KR' | 'overseas' | 'any'

interface EntityRow {
  id: string
  businessType: RowBusinessType
  foundingCountry: RowFoundingCountry
  result: EntityCode
}

const BT_OPTIONS: { value: RowBusinessType; label: string }[] = [
  { value: 'financial',   label: '금융업' },
  { value: 'corporation', label: '법인' },
  { value: 'individual',  label: '개인' },
  { value: 'any',         label: '(전체)' },
]

const FC_OPTIONS: { value: RowFoundingCountry; label: string }[] = [
  { value: 'KR',       label: '한국' },
  { value: 'overseas', label: '해외' },
  { value: 'any',      label: '(전체)' },
]

// Entity priority order for rebuilding the global rules list
const ENTITY_PRIO: Partial<Record<EntityCode, number>> = {
  ENTITY_FI: 0,
  ENTITY_CORP: 100,
  ENTITY_INDIV: 200,
}

function ruleToRow(rule: EntityClassificationRule): EntityRow {
  const btCond = rule.conditions.find((c: EntityClassificationCondition) => c.field === 'businessType')
  const fcCond = rule.conditions.find((c: EntityClassificationCondition) => c.field === 'foundingCountry')
  let businessType: RowBusinessType = 'any'
  if (btCond?.op === 'eq') businessType = btCond.value as RowBusinessType
  let foundingCountry: RowFoundingCountry = 'any'
  if (fcCond?.op === 'eq' && fcCond.value === 'KR') foundingCountry = 'KR'
  else if (fcCond?.op === 'neq' && fcCond.value === 'KR') foundingCountry = 'overseas'
  return { id: rule.id, businessType, foundingCountry, result: rule.result }
}

function rowToRule(row: EntityRow, priority: number): EntityClassificationRule {
  const conditions: EntityClassificationCondition[] = []
  if (row.businessType !== 'any') conditions.push({ field: 'businessType', op: 'eq', value: row.businessType })
  if (row.foundingCountry === 'KR') conditions.push({ field: 'foundingCountry', op: 'eq', value: 'KR' })
  else if (row.foundingCountry === 'overseas') conditions.push({ field: 'foundingCountry', op: 'neq', value: 'KR' })
  const btLabel = BT_OPTIONS.find(o => o.value === row.businessType)?.label ?? row.businessType
  const fcLabel = FC_OPTIONS.find(o => o.value === row.foundingCountry)?.label ?? row.foundingCountry
  return {
    id: row.id,
    conditionLabel: `${btLabel} / ${fcLabel}`,
    priority,
    conditions,
    conditionLogic: 'AND',
    result: row.result,
  }
}

function EntityClassificationTableEditor({ code }: { code: EntityCode }) {
  const { currentRuleSet, updateRuleSet } = useRuleStore()
  const rs = currentRuleSet

  const myRows: EntityRow[] = rs.entityClassificationRules
    .filter(r => r.result === code)
    .sort((a, b) => a.priority - b.priority)
    .map(ruleToRow)

  const ENTITY_OPTIONS: { value: EntityCode; label: string }[] = [
    { value: 'ENTITY_FI',    label: rs.entityLabels['ENTITY_FI']    ?? 'FI' },
    { value: 'ENTITY_CORP',  label: rs.entityLabels['ENTITY_CORP']  ?? '법인' },
    { value: 'ENTITY_INDIV', label: rs.entityLabels['ENTITY_INDIV'] ?? '개인사업자' },
  ]

  function saveRows(nextRows: EntityRow[]) {
    const otherRules = rs.entityClassificationRules.filter(r => r.result !== code)
    const thisRules = nextRows.map((row, i) => rowToRule(row, i + 1))
    const allRules = [...otherRules, ...thisRules]
      .sort((a, b) => {
        const ap = (ENTITY_PRIO[a.result] ?? 500) + a.priority
        const bp = (ENTITY_PRIO[b.result] ?? 500) + b.priority
        return ap - bp
      })
      .map((r, i) => ({ ...r, priority: i + 1 }))
    updateRuleSet({ ...rs, version: nextVersion(rs.version), entityClassificationRules: allRules })
  }

  function updateRow(idx: number, patch: Partial<EntityRow>) {
    saveRows(myRows.map((r, i) => i === idx ? { ...r, ...patch } : r))
  }

  function addRow() {
    saveRows([...myRows, { id: `ecr_${Date.now()}`, businessType: 'any', foundingCountry: 'any', result: code }])
  }

  function removeRow(idx: number) {
    saveRows(myRows.filter((_, i) => i !== idx))
  }

  const sel = 'w-full text-[12px] border border-sb-n200 rounded-[6px] px-2 py-1.5 bg-white focus:outline-none focus:border-sb-brand text-sb-n700'

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-sb-n400">이 세그먼트로 분류되는 조건 행을 편집합니다. 결과 세그먼트를 변경하면 해당 행은 다른 세그먼트의 뷰로 이동합니다.</p>

      <div className="bg-white rounded-[10px] border border-sb-n100 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 px-4 py-2 bg-sb-n50 border-b border-sb-n100">
          <span className="text-[11px] font-semibold text-sb-n500">사업자 유형</span>
          <span className="text-[11px] font-semibold text-sb-n500">설립국가</span>
          <span className="text-[11px] font-semibold text-sb-n500">결과 세그먼트</span>
          <span />
        </div>

        {myRows.length === 0 && (
          <p className="text-[12px] text-sb-n400 px-4 py-3">분류 조건 없음</p>
        )}

        {myRows.map((row, idx) => (
          <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_36px] gap-2 px-4 py-2.5 border-b border-sb-n100 last:border-0 items-center">
            <select value={row.businessType} onChange={(e) => updateRow(idx, { businessType: e.target.value as RowBusinessType })} className={sel}>
              {BT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={row.foundingCountry} onChange={(e) => updateRow(idx, { foundingCountry: e.target.value as RowFoundingCountry })} className={sel}>
              {FC_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select value={row.result} onChange={(e) => updateRow(idx, { result: e.target.value as EntityCode })} className={sel}>
              {ENTITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button
              onClick={() => removeRow(idx)}
              className="flex items-center justify-center w-7 h-7 rounded-[6px] text-sb-n400 hover:text-sb-negative hover:bg-red-50 transition-colors"
            >
              <Trash size={13} />
            </button>
          </div>
        ))}

        <div className="px-4 py-2.5 border-t border-sb-n100">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-[12px] font-medium text-sb-brand hover:underline"
          >
            <Plus size={12} />
            행 추가
          </button>
        </div>
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
  const [countrySelect, setCountrySelect] = useState('')

  const allServices = ['remittance', 'collection']

  // All country codes registered in any collection service rule (dropdown options)
  const registeredCountries = Array.from(new Set(
    rs.serviceClassificationRules
      .filter(r => r.triggerServices.includes('collection'))
      .flatMap(r => r.triggerCountries)
  ))

  function updateRule(patch: Partial<ServiceClassificationRule>) {
    if (!rule) return
    const updated = rs.serviceClassificationRules.map(r =>
      r.serviceCode === code ? { ...r, ...patch } : r
    )
    updateRuleSet({ ...rs, version: nextVersion(rs.version), serviceClassificationRules: updated })
  }

  if (!rule) {
    // SVC_ETC (기타 Collection) is an implicit fallback — no explicit trigger rule
    if (code.endsWith('ETC')) {
      return (
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-[10px] border border-sb-n100 p-5">
            <p className="text-[13px] font-semibold text-sb-n700 mb-2">분류 조건 (자동 폴백)</p>
            <p className="text-[13px] text-sb-n500">수금 선택 + 미등록 국가인 경우 이 세그먼트로 자동 분류됩니다.</p>
            <p className="text-[11px] text-sb-n400 mt-1 font-mono">collection + country not in any registered Collection segment</p>
          </div>
          <p className="text-[11px] text-sb-n400">이 조건은 코드로 관리되며 패널에서 편집할 수 없습니다.</p>
        </div>
      )
    }
    return (
      <p className="text-[13px] text-sb-n400">이 서비스 코드에 분류 규칙이 없습니다. (SVC_PAYOUT는 2차 인테이크에서 수동 지정)</p>
    )
  }

  const availableCountries = registeredCountries.filter(c => !rule.triggerCountries.includes(c))

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

        {/* 수금 국가 조건 — dropdown sourced from registered service segments */}
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-sb-n500 uppercase tracking-[0.5px]">
            수금 국가 조건 <span className="font-normal normal-case">(비어있으면 국가 무관)</span>
          </label>
          {availableCountries.length > 0 ? (
            <div className="flex gap-2">
              <select
                value={countrySelect}
                onChange={(e) => setCountrySelect(e.target.value)}
                className="flex-1 border border-sb-n200 rounded-[8px] px-3 py-1.5 text-[13px] font-mono bg-white focus:outline-none focus:border-sb-brand text-sb-n700"
              >
                <option value="">국가 선택</option>
                {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => {
                  if (countrySelect && !rule.triggerCountries.includes(countrySelect)) {
                    updateRule({ triggerCountries: [...rule.triggerCountries, countrySelect] })
                    setCountrySelect('')
                  }
                }}
                disabled={!countrySelect}
                className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium bg-sb-brand text-white disabled:opacity-40"
              >
                추가
              </button>
            </div>
          ) : (
            <p className="text-[12px] text-sb-n400">
              {registeredCountries.length === 0
                ? '등록된 수금 국가 없음 (국가 추가 위저드 사용)'
                : '모든 등록 국가가 이미 추가됨'}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 min-h-[24px]">
            {rule.triggerCountries.map(c => (
              <span key={c} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sb-blue-100 text-sb-brand text-[12px] font-mono font-medium">
                {c}
                <button
                  onClick={() => updateRule({ triggerCountries: rule.triggerCountries.filter(x => x !== c) })}
                  className="ml-0.5 hover:text-sb-negative leading-none"
                >
                  ×
                </button>
              </span>
            ))}
            {rule.triggerCountries.length === 0 && <p className="text-[12px] text-sb-n400">추가된 국가 없음</p>}
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

// ── Add-country wizard (PI-42) ────────────────────────────────────────────────

interface WizardData {
  serviceCode: string
  displayName: string
  triggerServices: string[]
  triggerCountries: string[]
  enabledCommonQuestionIds: string[]
  ownQuestions: QuestionRule[]
  baseDocs: DocTemplateRule[]
}

function AddCountryWizard({ onFinish, onCancel }: {
  onFinish: (data: WizardData) => void
  onCancel: () => void
}) {
  const rs = getRuleSet()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [d, setD] = useState<WizardData>({
    serviceCode: 'SVC_',
    displayName: '',
    triggerServices: ['collection'],
    triggerCountries: [],
    enabledCommonQuestionIds: ['qc_biz_reg_no', 'qc_biz_type'],
    ownQuestions: [],
    baseDocs: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [countryInput, setCountryInput] = useState('')

  const existingCodes = Object.keys(rs.serviceLabels)
  const commonQuestions = rs.questionPool.filter(q => q.classification === 'common')

  function validateStep1() {
    const errs: Record<string, string> = {}
    if (!d.serviceCode || d.serviceCode === 'SVC_') errs.serviceCode = '코드를 입력하세요 (예: SVC_IDR)'
    else if (!d.serviceCode.startsWith('SVC_')) errs.serviceCode = 'SVC_로 시작해야 합니다'
    else if (existingCodes.includes(d.serviceCode)) errs.serviceCode = '이미 존재하는 코드입니다'
    if (!d.displayName) errs.displayName = '표시명을 입력하세요'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2() {
    const errs: Record<string, string> = {}
    if (d.triggerServices.length === 0) errs.triggerServices = '최소 하나의 서비스 조건이 필요합니다'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function addCountry() {
    if (countryInput && !d.triggerCountries.includes(countryInput)) {
      setD(p => ({ ...p, triggerCountries: [...p.triggerCountries, countryInput] }))
      setCountryInput('')
    }
  }

  const STEP_TITLES = ['기본 정보', '분류 조건', '질문 설정', '서류 설정']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl w-full max-w-[560px] mx-4 flex flex-col max-h-[90vh]">
        {/* Wizard header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sb-n100">
          <div>
            <p className="text-[11px] text-sb-n400 font-medium uppercase tracking-[0.5px]">국가 추가 ({step}/4)</p>
            <h3 className="text-[17px] font-semibold text-sb-n900">{STEP_TITLES[step - 1]}</h3>
          </div>
          <div className="flex gap-1.5 items-center">
            {([1, 2, 3, 4] as const).map(s => (
              <div key={s} className={`rounded-full transition-all ${s === step ? 'w-5 h-2 bg-sb-brand' : s < step ? 'w-2 h-2 bg-sb-brand/40' : 'w-2 h-2 bg-sb-n200'}`} />
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Step 1: Basics ── */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-[13px] font-medium text-sb-n700 mb-1.5">
                  서비스 코드 <span className="text-sb-negative">*</span>
                </label>
                <input
                  value={d.serviceCode}
                  onChange={(e) => setD(p => ({ ...p, serviceCode: e.target.value.toUpperCase() }))}
                  placeholder="SVC_IDR"
                  className={`w-full font-mono border rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-sb-brand ${errors.serviceCode ? 'border-sb-negative' : 'border-sb-n200'}`}
                />
                {errors.serviceCode
                  ? <p className="text-[12px] text-sb-negative mt-1">{errors.serviceCode}</p>
                  : <p className="text-[12px] text-sb-n400 mt-1">SVC_로 시작하는 고유 코드. 예: SVC_IDR, SVC_CNY, SVC_PHP</p>
                }
              </div>
              <div>
                <label className="block text-[13px] font-medium text-sb-n700 mb-1.5">
                  표시명 <span className="text-sb-negative">*</span>
                </label>
                <input
                  value={d.displayName}
                  onChange={(e) => setD(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="IDR Collection"
                  className={`w-full border rounded-[8px] px-3 py-2.5 text-[14px] focus:outline-none focus:border-sb-brand ${errors.displayName ? 'border-sb-negative' : 'border-sb-n200'}`}
                />
                {errors.displayName && <p className="text-[12px] text-sb-negative mt-1">{errors.displayName}</p>}
              </div>
            </div>
          )}

          {/* ── Step 2: Classification ── */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-[13px] font-semibold text-sb-n700 mb-1.5">서비스 선택 조건</label>
                <p className="text-[12px] text-sb-n400 mb-3">1차 인테이크에서 어떤 서비스가 선택될 때 이 세그먼트가 트리거되는지 설정합니다.</p>
                <div className="flex gap-5">
                  {['remittance', 'collection'].map(svc => (
                    <label key={svc} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={d.triggerServices.includes(svc)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...d.triggerServices, svc]
                            : d.triggerServices.filter(s => s !== svc)
                          setD(p => ({ ...p, triggerServices: next }))
                        }}
                        className="rounded border-sb-n300 text-sb-brand focus:ring-sb-brand"
                      />
                      <span className="text-[13px] font-mono text-sb-n700">{svc}</span>
                    </label>
                  ))}
                </div>
                {errors.triggerServices && <p className="text-[12px] text-sb-negative mt-1">{errors.triggerServices}</p>}
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-sb-n700 mb-1.5">수금 국가</label>
                <p className="text-[12px] text-sb-n400 mb-3">이 세그먼트를 트리거할 국가 코드를 추가합니다. 비어 있으면 국가 무관.</p>
                <div className="flex gap-2 mb-3">
                  <input
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && addCountry()}
                    placeholder="KR"
                    className="flex-1 font-mono border border-sb-n200 rounded-[8px] px-3 py-2 text-[14px] focus:outline-none focus:border-sb-brand"
                  />
                  <button
                    onClick={addCountry}
                    disabled={!countryInput}
                    className="px-4 py-2 rounded-[8px] text-[13px] font-medium bg-sb-brand text-white disabled:opacity-40"
                  >
                    추가
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {d.triggerCountries.map(c => (
                    <span key={c} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-sb-blue-100 text-sb-brand text-[12px] font-mono font-medium">
                      {c}
                      <button onClick={() => setD(p => ({ ...p, triggerCountries: p.triggerCountries.filter(x => x !== c) }))} className="ml-0.5 hover:text-sb-negative leading-none">×</button>
                    </span>
                  ))}
                  {d.triggerCountries.length === 0 && <p className="text-[12px] text-sb-n400">추가된 국가 없음</p>}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Questions ── */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-sb-n600">이 세그먼트에서 고객에게 표시할 공통 질문을 선택합니다. 세그먼트 고유 질문은 완료 후 Questions 탭에서 추가할 수 있습니다.</p>
              <div className="rounded-[10px] border border-sb-n100 overflow-hidden">
                {commonQuestions.map((q, i) => (
                  <label key={q.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-sb-n50 ${i > 0 ? 'border-t border-sb-n100' : ''}`}>
                    <input
                      type="checkbox"
                      checked={d.enabledCommonQuestionIds.includes(q.id)}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...d.enabledCommonQuestionIds, q.id]
                          : d.enabledCommonQuestionIds.filter(id => id !== q.id)
                        setD(p => ({ ...p, enabledCommonQuestionIds: next }))
                      }}
                      className="rounded border-sb-n300 text-sb-brand focus:ring-sb-brand"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-sb-n800">{q.label}</p>
                      <p className="text-[11px] font-mono text-sb-n400">{q.id}</p>
                    </div>
                    <span className="text-[10px] font-mono text-sb-n400 px-1.5 py-0.5 border border-sb-n100 rounded bg-white flex-shrink-0">{q.inputType}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Documents ── */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-sb-n600">기본 서류 목록을 입력합니다. 완료 후 Documents 탭에서 언제든 수정할 수 있습니다.</p>
              <div className="rounded-[10px] border border-sb-n100 p-4">
                {d.baseDocs.length === 0 && <p className="text-[12px] text-sb-n400 py-1">추가된 서류 없음</p>}
                <div className="flex flex-col divide-y divide-sb-n100 mb-1">
                  {d.baseDocs.map((doc, i) => (
                    <div key={doc.type} className="flex items-center gap-3 py-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-sb-n800">{doc.displayName}</p>
                        <p className="text-[11px] font-mono text-sb-n400">{doc.type}</p>
                      </div>
                      <span className={`text-[10px] rounded-full px-2 py-0.5 flex-shrink-0 ${doc.isRequired ? 'bg-red-50 text-sb-negative' : 'bg-sb-n50 text-sb-n500'}`}>
                        {doc.isRequired ? '필수' : '선택'}
                      </span>
                      <button
                        onClick={() => setD(p => ({ ...p, baseDocs: p.baseDocs.filter((_, idx) => idx !== i) }))}
                        className="w-7 h-7 flex items-center justify-center rounded-[6px] text-sb-n400 hover:text-sb-negative hover:bg-red-50"
                      >
                        <Trash size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <AddDocForm onAdd={(doc) => setD(p => ({ ...p, baseDocs: [...p.baseDocs, doc] }))} />
              </div>
            </div>
          )}
        </div>

        {/* Wizard footer */}
        <div className="flex justify-between px-6 py-4 border-t border-sb-n100">
          <button
            onClick={() => { if (step === 1) onCancel(); else setStep(s => (s - 1) as 1 | 2 | 3 | 4) }}
            className="px-4 py-2.5 rounded-[8px] text-[13px] font-medium text-sb-n600 border border-sb-n200 hover:bg-sb-n50"
          >
            {step === 1 ? '취소' : '← 이전'}
          </button>
          <button
            onClick={() => {
              if (step === 1 && validateStep1()) setStep(2)
              else if (step === 2 && validateStep2()) setStep(3)
              else if (step === 3) setStep(4)
              else if (step === 4) onFinish(d)
            }}
            className="px-5 py-2.5 rounded-[8px] text-[13px] font-medium bg-sb-brand text-white"
          >
            {step === 4 ? '완료 →' : '다음 →'}
          </button>
        </div>
      </div>
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
  const { currentRuleSet, updateRuleSet } = useRuleStore()
  const rs = currentRuleSet

  const [selected, setSelected] = useState<Selection>({ type: 'entity', code: 'ENTITY_CORP' })
  const [entityTab, setEntityTab] = useState<EntityTab>('classification')
  const [serviceTab, setServiceTab] = useState<ServiceTab>('condition')
  const [wizardOpen, setWizardOpen] = useState(false)

  const isIntake = selected.type === 'intake'

  // Dynamic service order: seeded + wizard-created codes
  const serviceOrder = Object.keys(rs.serviceLabels) as ServiceCode[]

  function handleWizardFinish(data: WizardData) {
    const newCode = data.serviceCode as ServiceCode
    const fullRs = getRuleSet()
    updateRuleSet({
      ...fullRs,
      version: nextVersion(fullRs.version),
      serviceLabels: { ...fullRs.serviceLabels, [newCode]: data.displayName },
      serviceClassificationRules: [
        ...fullRs.serviceClassificationRules,
        { serviceCode: newCode, triggerServices: data.triggerServices, triggerCountries: data.triggerCountries },
      ],
      segmentQuestionConfigs: [
        ...fullRs.segmentQuestionConfigs,
        { key: `service:${newCode}`, enabledCommonQuestionIds: data.enabledCommonQuestionIds, ownQuestions: data.ownQuestions },
      ],
      documentRules: [
        ...fullRs.documentRules,
        { match: { service: newCode }, docs: data.baseDocs },
      ],
    })
    setSelected({ type: 'service', code: newCode })
    setServiceTab('condition')
    setWizardOpen(false)
  }

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
        <aside className="w-[220px] flex-shrink-0 flex flex-col gap-1">
          {/* 인테이크 group */}
          <p className="text-[10px] font-semibold text-sb-n400 uppercase tracking-[0.8px] px-3 pt-2 pb-1">인테이크</p>
          <button
            onClick={() => setSelected({ type: 'intake' })}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-[8px] text-left transition-colors ${
              isIntake
                ? 'bg-sb-blue-100 text-sb-brand font-medium'
                : 'text-sb-n700 hover:bg-sb-n100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isIntake ? 'bg-sb-brand' : 'bg-sb-n300'}`} />
            <span className="text-[13px] leading-snug">1차 질문</span>
            <span className="ml-auto text-[10px] font-mono text-sb-n400">1차</span>
          </button>

          {/* Entity group */}
          <p className="text-[10px] font-semibold text-sb-n400 uppercase tracking-[0.8px] px-3 pt-3 pb-1">Entity</p>
          {ENTITY_ORDER.map(code => {
            const isActive = selected.type === 'entity' && selected.code === code
            return (
              <button
                key={code}
                onClick={() => selectEntity(code)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-[8px] text-left transition-colors ${
                  isActive ? 'bg-sb-blue-100 text-sb-brand font-medium' : 'text-sb-n700 hover:bg-sb-n100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-sb-brand' : 'bg-sb-n300'}`} />
                <span className="text-[13px] leading-snug">{rs.entityLabels[code]}</span>
                <span className="ml-auto text-[10px] font-mono text-sb-n400">{code.replace('ENTITY_', 'E·')}</span>
              </button>
            )
          })}

          {/* Service group */}
          <p className="text-[10px] font-semibold text-sb-n400 uppercase tracking-[0.8px] px-3 pt-3 pb-1">Service</p>
          {serviceOrder.map(code => {
            const isActive = selected.type === 'service' && selected.code === code
            return (
              <button
                key={code}
                onClick={() => selectService(code)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-[8px] text-left transition-colors ${
                  isActive ? 'bg-sb-blue-100 text-sb-brand font-medium' : 'text-sb-n700 hover:bg-sb-n100'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-sb-brand' : 'bg-sb-n300'}`} />
                <span className="text-[13px] leading-snug">{rs.serviceLabels[code]}</span>
                <span className="ml-auto text-[10px] font-mono text-sb-n400">{code.replace('SVC_COL_', 'C·')}</span>
              </button>
            )
          })}

          {/* Add country wizard */}
          <div className="pt-3">
            <button
              onClick={() => setWizardOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-dashed border-sb-brand text-[12px] text-sb-brand font-medium hover:bg-sb-blue-100 transition-colors w-full"
            >
              <Plus size={13} />
              국가 추가
            </button>
          </div>
        </aside>

        {/* Wizard modal */}
        {wizardOpen && (
          <AddCountryWizard onFinish={handleWizardFinish} onCancel={() => setWizardOpen(false)} />
        )}

        {/* ── Content area ─────────────────────────────────────────────────── */}
        <main className="flex-1 bg-white rounded-[12px] border border-sb-n100 p-6 overflow-auto">
          {selected.type === 'intake' && (
            <div>
              <div className="flex items-center gap-3 pb-4 border-b border-sb-n100 mb-5">
                <div>
                  <p className="text-[11px] font-mono text-sb-n400">인테이크</p>
                  <h2 className="text-[18px] font-semibold text-sb-n900">1차 질문</h2>
                </div>
                <span className="ml-auto text-[11px] font-mono bg-sb-n50 border border-sb-n100 px-2 py-1 rounded text-sb-n500">
                  {rs.version}
                </span>
              </div>
              <FirstQuestionsEditor />
            </div>
          )}

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
                  { id: 'questions' as EntityTab, label: 'Questions' },
                  { id: 'documents' as EntityTab, label: 'Documents' },
                ]}
                active={entityTab}
                onChange={setEntityTab}
              />

              {entityTab === 'classification' && <EntityClassificationTableEditor code={selected.code} />}
              {entityTab === 'questions' && <QuestionsEditor selected={selected} />}
              {entityTab === 'documents' && <DocumentsEditor selected={selected} />}
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
                  { id: 'questions' as ServiceTab, label: 'Questions' },
                  { id: 'documents' as ServiceTab, label: 'Documents' },
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
