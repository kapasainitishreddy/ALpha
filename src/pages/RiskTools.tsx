import { useState } from 'react'
import { Calculator, Info, ShieldAlert, TrendingUp } from 'lucide-react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { positionSize, rewardRisk, riskOfRuin, stopLossFor } from '@/lib/riskMath'
import { inr } from '@/lib/format'
import { useStore } from '@/store/useStore'

// Teaching-first screen: every calculation shows its working, not just an answer.
// These are the numbers a trader should run BEFORE entering, which is exactly the
// habit beginners skip. Nothing here places a trade.

function Teach({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-xs text-muted leading-relaxed">
      <Info size={14} className="shrink-0 mt-0.5 text-accent" />
      <p>{children}</p>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
        active ? 'bg-accent text-bg' : 'bg-panel2 text-muted border border-edge'
      }`}
    >
      {children}
    </button>
  )
}

export default function RiskTools() {
  const balance = useStore((s) => s.balance)
  const [tab, setTab] = useState<'size' | 'stop' | 'rr' | 'ruin'>('size')

  // Position sizer
  const [capital, setCapital] = useState(balance)
  const [entry, setEntry] = useState(1000)
  const [sl, setSl] = useState(985)
  const [riskPct, setRiskPct] = useState(1)
  const sized = positionSize({ capital, entry, stopLoss: sl, riskPct })

  // Stop-loss finder
  const [sQty, setSQty] = useState(10)
  const suggestedSl = stopLossFor(capital, entry, sQty, riskPct)

  // Reward:risk
  const [target, setTarget] = useState(1030)
  const rr = rewardRisk(entry, sl, target)

  // Risk of ruin
  const [winRate, setWinRate] = useState(50)
  const ruin = riskOfRuin(winRate, riskPct, rr.ratio || 1)

  return (
    <div className="space-y-6">
      <Banner>
        Plan the trade before you take it. These four numbers separate traders who last from traders who don't.
      </Banner>

      <div className="flex gap-2">
        <Tab active={tab === 'size'} onClick={() => setTab('size')}>Size</Tab>
        <Tab active={tab === 'stop'} onClick={() => setTab('stop')}>Stop</Tab>
        <Tab active={tab === 'rr'} onClick={() => setTab('rr')}>R:R</Tab>
        <Tab active={tab === 'ruin'} onClick={() => setTab('ruin')}>Ruin</Tab>
      </div>

      {/* Shared inputs */}
      <Section title="Your trade">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Capital ₹">
            <input className="input" type="number" value={capital} onChange={(e) => setCapital(Math.max(0, +e.target.value))} />
          </Field>
          <Field label="Entry price ₹">
            <input className="input" type="number" value={entry} onChange={(e) => setEntry(Math.max(0, +e.target.value))} />
          </Field>
          {tab !== 'stop' && (
            <Field label="Stop loss ₹">
              <input className="input" type="number" value={sl} onChange={(e) => setSl(Math.max(0, +e.target.value))} />
            </Field>
          )}
          {tab === 'stop' && (
            <Field label="Quantity">
              <input className="input" type="number" value={sQty} onChange={(e) => setSQty(Math.max(1, +e.target.value))} />
            </Field>
          )}
          {tab === 'rr' && (
            <Field label="Target ₹">
              <input className="input" type="number" value={target} onChange={(e) => setTarget(Math.max(0, +e.target.value))} />
            </Field>
          )}
          {tab === 'ruin' && (
            <Field label="Your win rate %">
              <input className="input" type="number" value={winRate} onChange={(e) => setWinRate(Math.min(99, Math.max(1, +e.target.value)))} />
            </Field>
          )}
          {tab !== 'rr' && tab !== 'ruin' && <div />}
        </div>

        <Field label={`Risk per trade: ${riskPct}% of capital = ${inr(capital * riskPct / 100)}`}>
          <input
            type="range" min={0.5} max={10} step={0.5} value={riskPct}
            onChange={(e) => setRiskPct(+e.target.value)}
            className="w-full accent-accent"
          />
        </Field>
        <Teach>
          Professionals risk 1–2% of capital per trade. At 2%, ten losses in a row still leaves you
          with over 80% of your money. At 20%, five losses wipe you out.
        </Teach>
      </Section>

      {/* --- Position sizer --- */}
      {tab === 'size' && (
        <Section title="How many shares should I buy?">
          {sized.valid ? (
            <>
              <div className="card !p-4 text-center">
                <div className="label">Buy this many</div>
                <div className="text-4xl font-extrabold text-accent my-1">{sized.qty}</div>
                <div className="text-xs text-muted">shares of a ₹{entry} stock</div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Position value" value={inr(sized.positionValue)} />
                <Stat label="If SL hits" value={inr(-sized.totalRisk)} tone={-1} />
                <Stat label="Capital used" value={`${sized.capitalUsedPct.toFixed(0)}%`} />
              </div>
              <Teach>
                The stop is ₹{sized.riskPerShare.toFixed(2)} below entry. {sized.qty} shares × ₹
                {sized.riskPerShare.toFixed(2)} = {inr(sized.totalRisk)} — exactly the {riskPct}% you
                agreed to risk. This is the whole trick: <b>the stop distance decides the quantity</b>,
                never the other way around.
              </Teach>
              {sized.problem && <Banner tone="warn">{sized.problem}</Banner>}
              {sized.capitalUsedPct > 35 && (
                <Teach>
                  This puts {sized.capitalUsedPct.toFixed(0)}% of your account into one position. Correct on
                  risk, heavy on concentration — a gap-down opens past your stop and the loss lands bigger
                  than planned. Stops protect you from moves, not from gaps.
                </Teach>
              )}
            </>
          ) : (
            <Banner tone="warn">{sized.problem}</Banner>
          )}
        </Section>
      )}

      {/* --- Stop loss finder --- */}
      {tab === 'stop' && (
        <Section title="Where should my stop loss go?">
          <div className="card !p-4 text-center">
            <div className="label">Place your stop at</div>
            <div className="text-4xl font-extrabold text-accent my-1">₹{suggestedSl.toFixed(2)}</div>
            <div className="text-xs text-muted">
              {(((entry - suggestedSl) / entry) * 100).toFixed(2)}% below your ₹{entry} entry
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Risk per share" value={inr(entry - suggestedSl)} />
            <Stat label="Total at risk" value={inr((entry - suggestedSl) * sQty)} tone={-1} />
          </div>
          <Teach>
            You want {sQty} shares and will risk {riskPct}% ({inr(capital * riskPct / 100)}). Split that
            across {sQty} shares and each can only fall ₹{((capital * riskPct / 100) / sQty).toFixed(2)}
            {' '}before you're out.
          </Teach>
          <Banner tone="warn">
            Check this against the chart. If a real support level sits below this price, your stop is too
            tight and normal noise will knock you out. Either buy fewer shares, or wait for a better entry.
          </Banner>
        </Section>
      )}

      {/* --- Reward:Risk --- */}
      {tab === 'rr' && (
        <Section title="Is this trade worth taking?">
          <div className={`card !p-4 text-center ${rr.verdict === 'good' ? 'border-up/60' : rr.verdict === 'poor' ? 'border-down/60' : ''}`}>
            <div className="label">Reward to risk</div>
            <div className={`text-4xl font-extrabold my-1 ${rr.verdict === 'good' ? 'text-up' : rr.verdict === 'poor' ? 'text-down' : 'text-warn'}`}>
              {rr.ratio.toFixed(2)} : 1
            </div>
            <div className="text-xs text-muted uppercase tracking-wide">{rr.verdict}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Risking" value={inr(rr.risk)} tone={-1} />
            <Stat label="To make" value={inr(rr.reward)} tone={1} />
          </div>
          <Teach>{rr.advice}</Teach>
          {rr.verdict === 'poor' && (
            <Banner tone="warn">
              Skip trades like this. A trader who takes only 1:2 setups can be wrong 6 times out of 10 and
              still make money. A trader who takes 0.5:1 setups must be right 7 times out of 10 just to
              stay flat — and nobody is.
            </Banner>
          )}
        </Section>
      )}

      {/* --- Risk of ruin --- */}
      {tab === 'ruin' && (
        <Section title="Will this blow up my account?">
          <div className={`card !p-4 text-center ${ruin.ruinPct > 25 ? 'border-down/60' : ruin.ruinPct > 5 ? 'border-warn/60' : 'border-up/60'}`}>
            <div className="label">Chance of halving your account</div>
            <div className={`text-4xl font-extrabold my-1 ${ruin.ruinPct > 25 ? 'text-down' : ruin.ruinPct > 5 ? 'text-warn' : 'text-up'}`}>
              {ruin.ruinPct.toFixed(1)}%
            </div>
            <div className="text-xs text-muted">
              over 100 trades at {winRate}% win rate, {riskPct}% risk, {rr.ratio.toFixed(1)}:1 reward
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Typical outcome" value={`${ruin.medianEndPct.toFixed(0)}%`} tone={ruin.medianEndPct - 100} />
            <Stat label="Bad-luck case" value={`${ruin.worstEndPct.toFixed(0)}%`} tone={ruin.worstEndPct - 100} />
          </div>
          <Teach>
            Simulated 400 times over 100 trades. Half the time you end near{' '}
            <b>{ruin.medianEndPct.toFixed(0)}%</b> of your starting money; one run in twenty ends at{' '}
            <b>{ruin.worstEndPct.toFixed(0)}%</b> or worse. "Ruin" here means losing half — from there you
            need a 100% gain just to get back to even.
          </Teach>

          {ruin.expectancy <= 0 ? (
            <Banner tone="warn">
              At a {winRate}% win rate with {rr.ratio.toFixed(1)}:1 reward you lose money on average every
              single trade. No position size fixes negative expectancy — the setup itself has to change.
            </Banner>
          ) : (
            <Teach>
              Your edge is positive: on average you make {ruin.expectancy.toFixed(2)}× the amount you risk
              per trade. Position sizing decides whether you survive long enough to collect it.
            </Teach>
          )}

          <div className="card !p-3 space-y-2">
            <div className="label mb-1">Same edge, different risk per trade</div>
            {[1, 2, 5, 10, 25].map((p) => {
              const r = riskOfRuin(winRate, p, rr.ratio || 1)
              return (
                <div key={p} className="flex items-center justify-between text-sm">
                  <span className="text-muted">Risk {p}%</span>
                  <span className="flex items-center gap-3">
                    <span className="text-muted text-xs">ends ~{r.medianEndPct.toFixed(0)}%</span>
                    <span className={`font-bold w-16 text-right ${r.ruinPct > 25 ? 'text-down' : r.ruinPct > 5 ? 'text-warn' : 'text-up'}`}>
                      {r.ruinPct.toFixed(1)}%
                    </span>
                  </span>
                </div>
              )
            })}
            <p className="text-[11px] text-muted pt-2 border-t border-edge">
              Same strategy, same win rate — only the bet size changes. This is why professionals obsess
              over sizing and beginners obsess over picking winners.
            </p>
          </div>
        </Section>
      )}

      <Banner>
        These are planning tools, not predictions. Mock money only — nothing here places a real trade.
      </Banner>
    </div>
  )
}
