import { Link } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { Banner, Empty, Section, Stat } from '@/components/common'
import { useStore } from '@/store/useStore'
import { performanceMetrics } from '@/lib/performanceMetrics'
import { inr } from '@/lib/format'

export default function PerformanceQuality() {
  const trades = useStore((s) => s.trades)
  const metrics = performanceMetrics(trades)

  if (!metrics.closedTrades) {
    return (
      <Empty
        icon={<BarChart3 size={30} />}
        title="No closed practice trades yet"
        body="Close a few mock trades first. Alpha will then calculate expectancy, profit factor, average win/loss and drawdown from your own practice history."
        action={<Link to="/manual" className="btn-primary inline-block">Start manual practice</Link>}
      />
    )
  }

  const pf = metrics.profitFactor === null ? 'no losing trades' : metrics.profitFactor.toFixed(2)

  return (
    <div className="space-y-6">
      <Banner>
        These are backward-looking statistics from your mock trades, not predictions. Use them to review process quality, not to infer future returns.
      </Banner>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Closed trades" value={String(metrics.closedTrades)} />
        <Stat label="Win rate" value={`${metrics.winRatePct.toFixed(1)}%`} />
        <Stat label="Expectancy / trade" value={inr(metrics.expectancy)} tone={metrics.expectancy} />
        <Stat label="Profit factor" value={pf} />
        <Stat label="Average win" value={inr(metrics.averageWin)} tone={metrics.averageWin} />
        <Stat label="Average loss" value={metrics.averageLoss ? `-${inr(metrics.averageLoss)}` : inr(0)} tone={metrics.averageLoss ? -1 : 0} />
      </div>

      <Section title="Drawdown review">
        <div className="card space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted">Largest peak-to-trough mock drawdown</span>
            <b className={metrics.maxDrawdown > 0 ? 'text-down' : ''}>{inr(metrics.maxDrawdown)}</b>
          </div>
          <p className="text-muted">
            Drawdown is measured from the cumulative closed-trade P/L curve. A profitable average can still hide uncomfortable losing runs, so review both numbers together.
          </p>
        </div>
      </Section>

      <Section title="How to read this">
        <div className="card text-sm space-y-2">
          <p><b>Expectancy</b> is the average mock P/L per closed trade.</p>
          <p><b>Profit factor</b> is gross mock profit divided by gross mock loss. It is intentionally shown as “no losing trades” instead of infinity.</p>
          <p><b>Average win/loss</b> helps reveal whether a high win rate is being offset by occasional large losses.</p>
        </div>
      </Section>
    </div>
  )
}
