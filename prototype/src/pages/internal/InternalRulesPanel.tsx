import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignOut, TreeStructure, Plus } from '@phosphor-icons/react'
import { useSessionStore } from '../../store/sessionStore'
import { useRuleStore } from '../../store/ruleStore'
import type { EntityCode, ServiceCode, EntityClassificationRule, ServiceClassificationRule } from '../../types'

type Selection =
  | { type: 'entity'; code: EntityCode }
  | { type: 'service'; code: ServiceCode }

const ENTITY_ORDER: EntityCode[] = ['ENTITY_CORP', 'ENTITY_INDIV', 'ENTITY_FI']
const SERVICE_ORDER: ServiceCode[] = ['SVC_KRW', 'SVC_VND', 'SVC_REMITTANCE', 'SVC_OTHER_COLL', 'SVC_PAYOUT']

function nextVersion(current: string): string {
  const m = current.match(/^v(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return current + '.1'
  return `v${m[1]}.${m[2]}.${parseInt(m[3]) + 1}`
}

// ── Entity classification editor ──────────────────────────────────────────────

function EntityClassificationEditor({ code: _code }: { code: EntityCode }) {
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
        <h3 className="text-[15px] font-semibold text-sb-n900 mb-1">분류 규칙</h3>
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
        현재 RuleSet 버전: <span className="font-mono font-medium text-sb-n700">{rs.version}</span>
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
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-sb-n400">이 서비스 코드에 분류 규칙이 없습니다. (SVC_PAYOUT는 2차 인테이크에서 수동 지정)</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-[15px] font-semibold text-sb-n900 mb-1">조건 설정</h3>
        <p className="text-[12px] text-sb-n400">1차 인테이크 폼에서 어떤 값이 선택될 때 이 서비스가 트리거되는지 설정합니다.</p>
      </div>

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
        현재 RuleSet 버전: <span className="font-mono font-medium text-sb-n700">{rs.version}</span>
        &nbsp;— 변경 시 자동으로 버전이 올라갑니다.
      </p>
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
          {/* Classification section */}
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
                  onClick={() => setSelected({ type: 'entity', code })}
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
                  onClick={() => setSelected({ type: 'service', code })}
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

          {/* Add country — wired in 5/5 */}
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
        <main className="flex-1 bg-white rounded-[12px] border border-sb-n100 p-6">
          {selected.type === 'entity' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 pb-4 border-b border-sb-n100">
                <div>
                  <p className="text-[11px] font-mono text-sb-n400">{selected.code}</p>
                  <h2 className="text-[18px] font-semibold text-sb-n900">{rs.entityLabels[selected.code]}</h2>
                </div>
                <span className="ml-auto text-[11px] font-mono bg-sb-n50 border border-sb-n100 px-2 py-1 rounded text-sb-n500">
                  {rs.version}
                </span>
              </div>

              <div>
                <h3 className="text-[13px] font-semibold text-sb-n700 mb-3">Classification</h3>
                <EntityClassificationEditor code={selected.code} />
              </div>
            </div>
          )}

          {selected.type === 'service' && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3 pb-4 border-b border-sb-n100">
                <div>
                  <p className="text-[11px] font-mono text-sb-n400">{selected.code}</p>
                  <h2 className="text-[18px] font-semibold text-sb-n900">{rs.serviceLabels[selected.code]}</h2>
                </div>
                <span className="ml-auto text-[11px] font-mono bg-sb-n50 border border-sb-n100 px-2 py-1 rounded text-sb-n500">
                  {rs.version}
                </span>
              </div>

              <div>
                <h3 className="text-[13px] font-semibold text-sb-n700 mb-3">Condition</h3>
                <ServiceConditionEditor code={selected.code} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
