import type { Document, DocumentStatus, SegmentInfo, RuleSet, EntityCode, ServiceCode } from '../types'
import { getRuleSet } from '../store/ruleStore'

// Legacy-to-code mappers for old localStorage cases
const LEGACY_ENTITY: Record<string, EntityCode> = {
  'SentBiz Corporate': 'ENTITY_CORP',
  'SentBiz Individual': 'ENTITY_INDIV',
  'FI': 'ENTITY_FI',
}
const LEGACY_SERVICE: Record<string, ServiceCode> = {
  'KRW Collection': 'SVC_COL_KRW',
  'VND Collection': 'SVC_COL_VND',
  'Remittance': 'SVC_PAYOUT',
  '기타 Collection': 'SVC_COL_ETC',
}
// Migration guard: normalize old SVC_* codes stored in pre-rename cases
const SVC_MIGRATION: Record<string, ServiceCode> = {
  SVC_KRW: 'SVC_COL_KRW', SVC_VND: 'SVC_COL_VND', SVC_ETC: 'SVC_COL_ETC',
}

function resolveEntity(seg: SegmentInfo): EntityCode {
  if (seg.entity) return seg.entity
  return LEGACY_ENTITY[seg.entitySegment ?? ''] ?? 'ENTITY_CORP'
}

function resolveServices(seg: SegmentInfo): ServiceCode[] {
  const codes = seg.services?.length
    ? seg.services
    : (seg.serviceSegments ?? []).map(s => LEGACY_SERVICE[s]).filter(Boolean) as ServiceCode[]
  // Normalize legacy SVC_REMITTANCE and pre-rename SVC_* codes stored in old localStorage cases
  return codes.map(c => {
    const s = c as string
    if (s === 'SVC_REMITTANCE') return 'SVC_PAYOUT'
    return SVC_MIGRATION[s] ?? c
  })
}

type DocTemplate = { type: string; displayName: string; isRequired: boolean; isConditional: boolean }

export function buildDocuments(
  caseId: string,
  segmentInfo: SegmentInfo,
  ruleSet?: RuleSet
): Document[] {
  const rs = ruleSet ?? getRuleSet()
  const entity = resolveEntity(segmentInfo)
  const services = resolveServices(segmentInfo)
  const sectors = segmentInfo.sectors ?? []

  const seenTypes = new Set<string>()
  const templates: DocTemplate[] = []

  function add(t: DocTemplate) {
    if (!seenTypes.has(t.type)) {
      seenTypes.add(t.type)
      templates.push(t)
    }
  }

  // ── New model (PI-81): docLibrary + segmentDocConfigs ──────────────────────
  if (rs.docLibrary && rs.segmentDocConfigs) {
    const commonDocs = rs.docLibrary.filter(d => d.classification === 'common')

    // Helper: apply enabled common docs for one segment key
    function applyCommon(segKey: string) {
      const cfg = rs.segmentDocConfigs!.find(c => c.key === segKey)
      if (!cfg) return
      for (const type of cfg.enabledCommonDocTypes) {
        const base = commonDocs.find(d => d.type === type)
        if (!base) continue
        const ov = cfg.commonOverrides?.[type]
        add({
          type,
          displayName: ov?.displayName ?? base.displayName,
          isRequired: ov?.isRequired ?? base.isRequired,
          isConditional: ov?.isConditional ?? base.isConditional,
        })
      }
    }

    // Entity common → service common (dedup by type)
    applyCommon(`entity:${entity}`)
    for (const svc of services) applyCommon(`service:${svc}`)

    // Entity own docs from library
    const entityCfg = rs.segmentDocConfigs.find(c => c.key === `entity:${entity}`)
    const entityDisabled = entityCfg?.disabledOwnDocTypes ?? []
    for (const doc of rs.docLibrary.filter(d => d.classification === 'entity-own' && d.scope === entity)) {
      if (!entityDisabled.includes(doc.type)) add(doc)
    }
    for (const doc of entityCfg?.ownDocs ?? []) add(doc)

    // Service own docs from library
    for (const svc of services) {
      const svcCfg = rs.segmentDocConfigs.find(c => c.key === `service:${svc}`)
      const svcDisabled = svcCfg?.disabledOwnDocTypes ?? []
      for (const doc of rs.docLibrary.filter(d => d.classification === 'service-own' && d.scope === svc)) {
        if (!svcDisabled.includes(doc.type)) add(doc)
      }
      for (const doc of svcCfg?.ownDocs ?? []) add(doc)
    }

    // Sector-specific docs remain in documentRules (sector only, no entity/service base)
    for (const rule of rs.documentRules) {
      const { entity: rEntity, service: rService, sector: rSector } = rule.match
      if (!rSector) continue  // only sector-scoped rules in new model
      if (rEntity !== undefined && rEntity !== entity) continue
      if (rService !== undefined && !services.includes(rService)) continue
      if (!sectors.includes(rSector)) continue
      for (const doc of rule.docs) add(doc)
    }
  } else {
    // ── Legacy model: plain documentRules ────────────────────────────────────
    for (const rule of rs.documentRules) {
      const { entity: rEntity, service: rService, sector: rSector } = rule.match
      if (rEntity !== undefined && rEntity !== entity) continue
      if (rService !== undefined && !services.includes(rService)) continue
      if (rSector !== undefined && !sectors.includes(rSector)) continue
      for (const doc of rule.docs) add(doc)
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
