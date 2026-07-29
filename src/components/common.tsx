import type { ReactNode } from 'react'
import { DISCLAIMERS } from '@/data/disclaimers'
import { pnlColor } from '@/lib/format'

export function MockBadge() {
  return (
    <span className="chip !text-up !border-up/40 !bg-up/10" title={DISCLAIMERS.general}>
      {DISCLAIMERS.mockBadge}
    </span>
  )
}

export function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  )
}

export function Stat({ label, value, tone }: { label: string; value: string; tone?: number }) {
  return (
    <div className="card !p-3">
      <div className="label">{label}</div>
      <div className={`text-lg font-bold ${tone !== undefined ? pnlColor(tone) : ''}`}>{value}</div>
    </div>
  )
}

export function Banner({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'lock' }) {
  const cls =
    tone === 'warn'
      ? 'border-warn/50 bg-warn/10 text-warn'
      : tone === 'lock'
        ? 'border-lock/50 bg-lock/10 text-lock'
        : 'border-accent/40 bg-accent/10 text-accent'
  return <div className={`rounded-xl border px-3 py-2 text-sm ${cls}`}>{children}</div>
}

// Empty states should tell you what to do next, not just report that nothing is here.
export function Empty({ icon, title, body, action }: { icon?: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card !p-6 text-center space-y-3">
      {icon && <div className="flex justify-center text-muted opacity-60">{icon}</div>}
      <div>
        <div className="font-semibold">{title}</div>
        <p className="text-sm text-muted mt-1 leading-relaxed">{body}</p>
      </div>
      {action}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="label">{label}</span>
      {children}
    </label>
  )
}
