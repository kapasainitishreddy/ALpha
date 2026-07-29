import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageCircleQuestion, Send, X } from 'lucide-react'
import { ask, suggestionsFor } from '@/engines/assistantEngine'
import { SpeakButton } from '@/components/SpeakButton'
import { useStore } from '@/store/useStore'

interface Msg { role: 'user' | 'bot'; text: string; followUps?: string[] }

// Always-available help. Deliberately not an LLM: no key, no network, no cost, and it can
// never invent a feature this app doesn't have. It says so when it doesn't know.
export function Assistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const fatherMode = useStore((s) => s.fatherMode)
  const { pathname } = useLocation()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, open])

  // Greet with suggestions relevant to whatever screen the user opened it from.
  useEffect(() => {
    if (!open || msgs.length) return
    setMsgs([{
      role: 'bot',
      text: fatherMode
        ? 'Cheppandi, emi telusukovali? Trading, risk, stop loss, ee app gurinchi adagandi.'
        : 'Ask me about trading or about how this app works. I answer from a fixed set of topics — no internet needed.',
      followUps: suggestionsFor(pathname),
    }])
  }, [open, msgs.length, pathname, fatherMode])

  const send = (text: string) => {
    const q = text.trim()
    if (!q) return
    const a = ask(q, { fatherMode, route: pathname })
    setMsgs((m) => [...m, { role: 'user', text: q }, { role: 'bot', text: a.text, followUps: a.followUps }])
    setInput('')
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open help assistant"
        className="fixed right-4 z-40 h-12 w-12 rounded-full bg-accent text-bg shadow-lg flex items-center justify-center active:scale-95 transition"
        style={{ bottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
      >
        <MessageCircleQuestion size={22} />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-md m-3 card !p-0 flex flex-col overflow-hidden"
        style={{ maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-edge shrink-0">
          <div>
            <div className="font-bold text-sm">Help</div>
            <div className="text-[10px] text-muted">built in · works offline · no AI key</div>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close help" className="text-muted hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {msgs.map((m, i) => (
            <div key={i}>
              <div className={m.role === 'user' ? 'flex justify-end' : ''}>
                <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line max-w-[85%] ${
                  m.role === 'user' ? 'bg-accent text-bg' : 'bg-panel2 border border-edge'
                }`}>
                  {m.text}
                </div>
              </div>
              {m.role === 'bot' && m.text.length > 120 && (
                <div className="mt-1.5"><SpeakButton text={m.text} label="Listen" /></div>
              )}
              {m.followUps && m.followUps.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.followUps.map((f) => (
                    <button key={f} className="chip !text-accent !border-accent/40 text-left" onClick={() => send(f)}>
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form
          className="flex gap-2 px-3 py-3 border-t border-edge shrink-0"
          onSubmit={(e) => { e.preventDefault(); send(input) }}
        >
          <input
            className="input flex-1"
            placeholder="Ask a question…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="btn-primary !px-3" type="submit" disabled={!input.trim()} aria-label="Send">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
