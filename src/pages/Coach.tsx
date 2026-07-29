import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Banner } from '@/components/common'
import { askCoachLLM } from '@/engines/llmCoach'
import { useStore } from '@/store/useStore'
import { Settings2 } from 'lucide-react'

interface Msg { from: 'you' | 'coach'; text: string; engine?: 'rules' | 'llm'; refused?: boolean }

const SUGGESTIONS = [
  'What is a stop loss?',
  'Stop loss అంటే ఏమిటి?',
  'How much should I trade?',
  'Explain the Strategy Swarm',
  'Why was my trade blocked?',
]

export default function Coach() {
  const fatherMode = useStore((s) => s.fatherMode)
  const llm = useStore((s) => s.llm)
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: 'coach', text: 'Namaste. Ask me about trading, strategy, risk, or this app, in English or Telugu. I only help with those topics.' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async (q: string) => {
    if (!q.trim() || busy) return
    setInput('')
    setMsgs((m) => [...m, { from: 'you', text: q }])
    setBusy(true)
    const reply = await askCoachLLM(q, llm, fatherMode)
    setMsgs((m) => [...m, { from: 'coach', text: reply.text, engine: reply.engine, refused: reply.source === 'refusal' }])
    setBusy(false)
  }

  return (
    <div className="space-y-4">
      <Banner>
        {llm.enabled
          ? 'AI coach is on. Falls back to the built-in coach if the provider is unreachable.'
          : 'Built-in coach (offline, free). Add an AI API key in AI Settings for smarter answers, including Telugu.'}
      </Banner>

      <div className="space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'you' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.from === 'you' ? 'bg-accent text-bg' : 'bg-panel border border-edge'}`}>
              {m.text}
              {m.from === 'coach' && m.engine && (
                <div className="text-[10px] mt-1 opacity-50">
                  {m.refused ? 'off-topic, refused' : m.engine === 'llm' ? 'AI model' : 'built-in coach'}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3 py-2 text-sm bg-panel border border-edge text-muted">thinking...</div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} className="chip hover:border-accent" disabled={busy} onClick={() => send(s)}>{s}</button>
        ))}
      </div>

      <div className="flex gap-2 sticky bottom-20">
        <input
          className="input"
          placeholder="Ask in English or Telugu..."
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send(input)}
        />
        <button className="btn-primary" disabled={busy} onClick={() => send(input)}>Send</button>
      </div>

      <Link to="/settings/ai" className="flex items-center justify-center gap-1 text-xs text-accent">
        <Settings2 size={12} /> AI Settings
      </Link>
    </div>
  )
}
