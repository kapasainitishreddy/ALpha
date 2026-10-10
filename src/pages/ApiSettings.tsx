import { Banner, Field, Section } from '@/components/common'
import { useStore, type ApiKeys } from '@/store/useStore'

const GROUPS: { title: string; keys: { k: keyof ApiKeys; label: string }[] }[] = [
  { title: 'Broker connectors (not implemented; orders locked)', keys: [
    { k: 'upstox', label: 'Upstox' }, { k: 'dhan', label: 'Dhan' }, { k: 'zerodha', label: 'Zerodha Kite' }, { k: 'angelone', label: 'Angel One SmartAPI' },
  ] },
  { title: 'Crypto / market data', keys: [{ k: 'coingecko', label: 'CoinGecko' }, { k: 'binance', label: 'Binance (public)' }] },
]

export default function ApiSettings() {
  const { apiKeys, setKey } = useStore()
  return (
    <div className="space-y-5">
      <Banner tone="warn">
        <b>No key is required.</b> The app is fully free in mock mode. Keys stay in memory for this session and are removed on reload. Never use a shared device. Never enter bank passwords, cards, or OTPs.
      </Banner>
      {GROUPS.map((g) => (
        <Section key={g.title} title={g.title}>
          <div className="space-y-3">
            {g.keys.map(({ k, label }) => (
              <Field key={k} label={label}>
                <input
                  className="input" type="password" placeholder="optional, leave blank"
                  value={apiKeys[k] ?? ''} onChange={(e) => setKey(k, e.target.value)}
                />
              </Field>
            ))}
          </div>
        </Section>
      ))}
      <Banner>These broker fields are reserved for future connectors and do not fetch data or place orders. No order can be placed, Real Mode is locked. For the AI coach key, use AI Settings.</Banner>
    </div>
  )
}
