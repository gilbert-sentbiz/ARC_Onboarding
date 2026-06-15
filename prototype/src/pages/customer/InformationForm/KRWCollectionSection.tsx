import { useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'
import Select from '../../../components/ui/Select'
import Button from '../../../components/ui/Button'
import FormShell from './FormShell'

const SECTOR_OPTIONS = [
  { value: 'trading_b2b', label: 'Trading (B2B)' },
  { value: 'trading_b2c', label: 'Trading (B2C)' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'dev_design', label: 'Development / Design' },
  { value: 'advertising', label: 'Advertising / Marketing' },
  { value: 'research', label: 'Research' },
  { value: 'it_computer', label: 'IT & Computer' },
  { value: 'coupang', label: 'Coupang (Sunrate or Payful)' },
]

interface Props {
  onComplete: (data: Record<string, unknown>) => void
  onBack: () => void
}

export default function KRWCollectionSection({ onComplete, onBack }: Props) {
  const [sector, setSector] = useState('')
  const [error, setError] = useState('')

  function handleNext() {
    if (!sector) { setError('섹터를 선택해주세요.'); return }
    onComplete({ sector })
  }

  return (
    <FormShell step={0} totalSteps={1} titles={['KRW Collection — 섹터 선택']} onBack={onBack}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          <p className="text-[12px] font-semibold text-sb-brand tracking-[1px] uppercase">서비스 섹터</p>
          <p className="text-[14px] text-sb-n600">
            KRW 수금 서비스의 거래 유형을 선택해주세요. 섹터에 따라 요청 서류가 달라집니다.
          </p>
          <Select
            label="Sector / Sub-Segment"
            required
            options={SECTOR_OPTIONS}
            placeholder="선택해주세요"
            value={sector}
            onChange={e => { setSector(e.target.value); setError('') }}
            error={error}
          />
          {sector === 'coupang' && (
            <div className="p-4 bg-sb-blue-50 border border-sb-blue-200 rounded-[10px]">
              <p className="text-[13px] font-semibold text-sb-brand mb-1">Coupang 즉시 승인 경로</p>
              <p className="text-[13px] text-sb-n600">
                모든 서류가 갖춰지고 유효한 경우, 별도 수동 검토 없이 즉시 승인됩니다.
                (Coupang Seller URL + 정산서 + Sunrate/Payful 서비스 계약서 필요)
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="pt-4">
        <Button onClick={handleNext} fullWidth>
          다음 <ArrowRight size={16} />
        </Button>
      </div>
    </FormShell>
  )
}
