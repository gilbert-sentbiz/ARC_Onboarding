import type { Document, DocumentStatus, SegmentInfo, RuleSet, EntityCode, ServiceCode } from '../types'
import { getRuleSet } from '../store/ruleStore'

// Legacy-to-code mappers for old localStorage cases
const LEGACY_ENTITY: Record<string, EntityCode> = {
  'SentBiz Corporate': 'ENTITY_CORP',
  'SentBiz Individual': 'ENTITY_INDIV',
  'FI': 'ENTITY_FI',
}
const LEGACY_SERVICE: Record<string, ServiceCode> = {
  'KRW Collection': 'SVC_KRW',
  'VND Collection': 'SVC_VND',
  'Remittance': 'SVC_PAYOUT',
  '기타 Collection': 'SVC_OTHER_COLL',
}

function resolveEntity(seg: SegmentInfo): EntityCode {
  if (seg.entity) return seg.entity
  return LEGACY_ENTITY[seg.entitySegment ?? ''] ?? 'ENTITY_CORP'
}

function resolveServices(seg: SegmentInfo): ServiceCode[] {
  const codes = seg.services?.length
    ? seg.services
    : (seg.serviceSegments ?? []).map(s => LEGACY_SERVICE[s]).filter(Boolean) as ServiceCode[]
  // Normalize legacy SVC_REMITTANCE stored in old localStorage cases
  return codes.map(c => (c as string) === 'SVC_REMITTANCE' ? 'SVC_PAYOUT' : c)
}

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
  const templates: Array<{ type: string; displayName: string; isRequired: boolean; isConditional: boolean }> = []

  for (const rule of rs.documentRules) {
    const { entity: rEntity, service: rService, sector: rSector } = rule.match
    if (rEntity !== undefined && rEntity !== entity) continue
    if (rService !== undefined && !services.includes(rService)) continue
    if (rSector !== undefined && !sectors.includes(rSector)) continue

    for (const doc of rule.docs) {
      if (!seenTypes.has(doc.type)) {
        seenTypes.add(doc.type)
        templates.push(doc)
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
