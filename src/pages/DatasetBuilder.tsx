import { useMemo, useState } from 'react'
import { Banner, Section, Stat } from '@/components/common'
import { buildDataset, toJsonl, DATASET_TARGETS } from '@/engines/fineTuneDatasetBuilder'

export default function DatasetBuilder() {
  const rows = useMemo(() => buildDataset(), [])
  const [preview, setPreview] = useState(false)

  const byCat = rows.reduce<Record<string, number>>((acc, r) => { acc[r.category] = (acc[r.category] ?? 0) + 1; return acc }, {})

  const download = () => {
    const blob = new Blob([toJsonl(rows)], { type: 'application/jsonl' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'blackscythe-finetune.jsonl'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <Banner>Builds instruction-tuning JSONL for a future finance tutor. Fine-tune for tone/explanation/refusal, <b>not</b> price prediction.</Banner>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Examples now" value={String(rows.length)} />
        <Stat label="Starter target" value={String(DATASET_TARGETS.starter)} />
        <Stat label="Serious target" value={String(DATASET_TARGETS.serious)} />
      </div>

      <Section title="By category">
        <div className="space-y-1">
          {Object.entries(byCat).map(([c, n]) => (
            <div key={c} className="flex justify-between text-sm border-b border-edge/50 py-1"><span>{c}</span><span className="chip">{n}</span></div>
          ))}
        </div>
      </Section>

      <div className="flex gap-3">
        <button className="btn-primary flex-1" onClick={download}>Download JSONL</button>
        <button className="btn-ghost flex-1" onClick={() => setPreview((p) => !p)}>{preview ? 'Hide' : 'Preview'}</button>
      </div>

      {preview && (
        <pre className="card !p-3 text-[10px] overflow-x-auto whitespace-pre-wrap">
          {toJsonl(rows.slice(0, 4))}
        </pre>
      )}
      <Banner>Expand templates and add real reviewed sessions to reach {DATASET_TARGETS.strong.toLocaleString()}+ examples.</Banner>
    </div>
  )
}
