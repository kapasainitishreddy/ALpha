import { Banner, Section, Stat } from '@/components/common'
import { useStore, modeLabel } from '@/store/useStore'
import { buildComparison } from '@/engines/comparisonEngine'
import { inr, pnlColor } from '@/lib/format'

export default function Comparison() {
  const modeStats = useStore((s) => s.modeStats)
  const report = buildComparison(modeStats)

  if (!modeStats.length) {
    return <Banner>Play sessions in different modes (manual, assisted, auto, swarm) and save them, then compare here.</Banner>
  }

  return (
    <div className="space-y-4">
      <Banner>Human vs AI vs Swarm, by mock P/L, win rate and drawdown.</Banner>
      <div className="grid grid-cols-2 gap-3">
        {report.bestMode && <Stat label="Best P/L" value={modeLabel[report.bestMode]} />}
        {report.safestMode && <Stat label="Safest (low DD)" value={modeLabel[report.safestMode]} />}
      </div>

      <Section title="By mode">
        <div className="space-y-2">
          {report.stats.map((s) => (
            <div key={s.mode} className="card !p-3">
              <div className="flex justify-between">
                <span className="font-semibold">{modeLabel[s.mode]}</span>
                <span className={`font-bold ${pnlColor(s.pnl)}`}>{inr(s.pnl)}</span>
              </div>
              <div className="text-xs text-muted mt-1">
                {s.trades} trades · win {s.winRatePct.toFixed(0)}% · max DD {s.maxDrawdownPct}%
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Banner>{report.bestLearningPoint}</Banner>
    </div>
  )
}
