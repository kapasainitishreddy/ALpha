import { Lock as LockIcon } from 'lucide-react'
import { Banner, Section } from '@/components/common'
import { DISCLAIMERS } from '@/data/disclaimers'
import { RISK_LIMITS } from '@/data/riskRules'

// Real Trading Mode is permanently LOCKED in v1. There is deliberately NO broker order path anywhere.
export default function RealMode() {
  return (
    <div className="space-y-5">
      <div className="card text-center py-8">
        <LockIcon size={44} strokeWidth={1.5} className="mx-auto text-lock" />
        <div className="font-bold text-lg mt-2">Real Trading Mode</div>
        <div className="text-muted text-sm mt-1">{DISCLAIMERS.realLocked}</div>
      </div>

      <Banner tone="lock">No real money can move in this version. There is no live order button anywhere in the app.</Banner>

      <Section title="Can I buy real shares with this app?">
        <div className="card space-y-3 text-sm leading-relaxed">
          <p><b className="text-down">No.</b> This app cannot buy or sell anything real. It is a practice
          simulator — like a flight simulator, which teaches you to fly but is not a plane.</p>
          <p className="text-muted">
            To trade real shares in India you need an account with a SEBI-registered broker — Zerodha,
            Groww, Upstox, Angel One and others — which requires KYC with your PAN and Aadhaar. That
            happens in their app, never in this one.
          </p>
          <p className="text-muted">
            Prices shown in Live Practice and the Watchlist are real and publicly available, which is why
            practising against them feels realistic. Your money here is still entirely fake.
          </p>
          <p className="text-muted">
            When you do go real, start far smaller than feels worthwhile. The gap between simulator and
            live markets is not the charts — it is that losing real money changes the decisions you make.
          </p>
        </div>
      </Section>

      <Section title="If it is ever unlocked (future), these caps apply">
        <div className="card text-sm space-y-1">
          <Row k="Max total exposure" v={`₹${RISK_LIMITS.realMaxExposure}`} />
          <Row k="Max per trade" v={`₹${RISK_LIMITS.realMaxPerTrade}`} />
          <Row k="Max daily loss" v={`₹${RISK_LIMITS.realMaxDailyLoss}`} />
          <Row k="Max trades/day" v={String(RISK_LIMITS.realMaxTradesPerDay)} />
          <Row k="Manual approval" v="required for every order" />
          <Row k="Auto real-money trading" v="never" />
          <Row k="Leverage / F&O in Father Mode" v="not allowed" />
        </div>
      </Section>

      <Banner>Practice in mock mode first. See docs/future-real-mode-compliance.md for the full checklist.</Banner>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="label">{k}</span><span>{v}</span></div>
}
