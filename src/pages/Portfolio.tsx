import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { useTranslation } from '@/lib/i18n'
import { reservedCapital } from '@/engines/paperExecution'
import { deleteAllLocalData, exportBackup, inspectBackup, restoreBackup, downloadText, type BackupPreview } from '@/lib/backup'
import { inr, pnlColor } from '@/lib/format'
import { Banner, Section, Stat } from '@/components/common'
function sessionRoute(id: string, symbol: string): string {
  if (id.startsWith('live:')) return '/live'
  if (id.startsWith('replay:')) return '/replay'
  if (id.startsWith('daily:')) {
    const [, date, sym, event] = id.split(':')
    return `/manual?daily=${date}&symbol=${sym}&event=${event}`
  }
  const [, mode, sym, event, seed] = id.split(':')
  return `/${mode === 'assisted' ? 'assisted' : 'manual'}?symbol=${sym ?? symbol}&event=${event ?? 'normal-trend'}&seed=${seed ?? 0}`
}
export default function Portfolio() {
  const s = useStore()
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [pendingBackup, setPendingBackup] = useState<{ text: string; preview: BackupPreview } | null>(null)
  const open = s.trades.filter((t) => t.status === 'open')
  const closed = s.trades.filter((t) => t.status === 'closed')
  const reserve = reservedCapital()
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{t('portfolio')}</h1>
      <Banner>{t('paperNotice')}</Banner>
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t('balance')} value={inr(s.balance)} />
        <Stat label={t('availableCapital')} value={inr(Math.max(0, s.balance - reserve))} />
        <Stat label="Reserved notional + fees" value={inr(reserve)} />
        <Stat
          label="Net realized P/L"
          value={inr(closed.reduce((v, t) => v + (t.realizedPnl ?? 0), 0))}
        />
      </div>
      <Section title={t('openPositions')}>
        {open.length ? (
          open.map((trade) => (
            <Link
              className="card block text-sm"
              key={trade.id}
              to={sessionRoute(trade.sessionId ?? '', trade.symbol)}
            >
              <b>
                {trade.symbol} {trade.side} ×{trade.qty}
              </b>
              <p className="text-muted">
                {inr(trade.entryPrice)} · SL {inr(trade.stopLoss ?? 0)} · {t('practice')} →
              </p>
            </Link>
          ))
        ) : (
          <p className="text-muted text-sm">0</p>
        )}
      </Section>
      <Section title="Pending orders">
        {s.pendingOrders.map((o) => (
          <div className="card flex justify-between text-sm" key={o.id}>
            <Link to={sessionRoute(o.sessionId, o.order.symbol)}>
              {o.order.symbol} {o.order.type} ×{o.order.qty}
            </Link>
            <button className="chip" onClick={() => s.removePending(o.id)}>
              Cancel
            </button>
          </div>
        ))}
      </Section>
      <Section title={t('closedTrades')}>
        {closed.slice(0, 50).map((trade) => (
          <div className="flex justify-between text-sm border-b border-edge py-2" key={trade.id}>
            <span>
              {trade.symbol} {trade.side} ×{trade.qty}
            </span>
            <span className={pnlColor(trade.realizedPnl ?? 0)}>{inr(trade.realizedPnl ?? 0)}</span>
          </div>
        ))}
      </Section>
      <Section title="Device backup">
        <button
          className="btn-primary w-full"
          onClick={() => downloadText(`alpha-backup-${Date.now()}.json`, exportBackup())}
        >
          {t('export')}
        </button>
        <label className="block space-y-2">
          <span className="label">{t('import')}</span>
          <input
            type="file"
            accept="application/json,.json"
            className="input"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                if (file.size > 5000000) throw new Error('Backup exceeds 5 MB.')
                const text = await file.text()
                const preview = inspectBackup(text)
                setPendingBackup({ text, preview })
                setMessage('Review the backup contents before replacing data.')
              } catch (err) {
                setPendingBackup(null)
                setMessage(err instanceof Error ? err.message : 'Invalid backup')
              } finally {
                e.target.value = ''
              }
            }}
          />
        </label>
        {pendingBackup && (
          <div className="card space-y-2 text-sm" aria-label="Backup preview">
            <p className="font-bold">Backup preview · version {pendingBackup.preview.version}</p>
            <p>Saved: {pendingBackup.preview.savedAt}</p>
            <p>
              Main account: ₹{pendingBackup.preview.balance.toLocaleString()} balance ·{' '}
              {pendingBackup.preview.trades} trades ({pendingBackup.preview.openPositions} open) ·{' '}
              {pendingBackup.preview.pendingOrders} pending orders ·{' '}
              {pendingBackup.preview.journalEntries} journal entries
            </p>
            {pendingBackup.preview.version === 2 ? (
              <p>
                Separate derivatives lab: {pendingBackup.preview.derivativePositions} positions
                ({pendingBackup.preview.openDerivativePositions} open) · research note:{' '}
                {pendingBackup.preview.researchNoteSections} filled sections
              </p>
            ) : (
              <p role="note">
                This legacy backup has no derivatives lab or research note. Existing copies on this
                device will be preserved. Legacy order-event history is also preserved.
              </p>
            )}
            <div className="flex gap-2">
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  if (!confirm('Replace the paper account and included learning records on this device?')) return
                  try {
                    restoreBackup(pendingBackup.text)
                    setMessage('Backup restored. Reloading…')
                    window.setTimeout(() => window.location.reload(), 100)
                  } catch (err) {
                    setMessage(err instanceof Error ? err.message : 'Restore failed')
                  }
                }}
              >
                Restore this backup
              </button>
              <button className="chip" onClick={() => setPendingBackup(null)}>
                Cancel
              </button>
            </div>
          </div>
        )}
        {message && (
          <p role="status" className="text-sm">
            {message}
          </p>
        )}
        <p className="text-xs text-muted">
          Backup excludes API keys. Data stays on this device; no account sync. Export before
          clearing browser storage.
        </p>
        <button
          className="btn w-full"
          onClick={() => {
            if (!confirm('Delete all paper-account, derivatives-lab and research-note data on this device? This cannot be undone. Export a backup first if you may need these records.')) return
            try {
              deleteAllLocalData()
              setMessage('Local practice data deleted. Reloading…')
              window.setTimeout(() => window.location.reload(), 100)
            } catch (err) {
              setMessage(err instanceof Error ? err.message : 'Delete failed')
            }
          }}
        >
          Delete all local practice data
        </button>
      </Section>
      <Banner>{t('simulationCosts')}</Banner>
    </div>
  )
}
