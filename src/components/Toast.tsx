import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

// Replaces the scattered inline "Copied." / "Saved." strings. One place, consistent placement,
// auto-dismiss, and it doesn't push the layout around when it appears.

type Tone = 'ok' | 'warn' | 'info'
interface Toast { id: number; text: string; tone: Tone }

const Ctx = createContext<(text: string, tone?: Tone) => void>(() => {})
export const useToast = () => useContext(Ctx)

const ICON = { ok: CheckCircle2, warn: TriangleAlert, info: Info }
const STYLE: Record<Tone, string> = {
  ok: 'border-up/50 bg-up/15 text-up',
  warn: 'border-warn/50 bg-warn/15 text-warn',
  info: 'border-accent/50 bg-accent/15 text-accent',
}

function Item({ t, onClose }: { t: Toast; onClose: () => void }) {
  const Icon = ICON[t.tone]
  useEffect(() => {
    const id = setTimeout(onClose, 3200)
    return () => clearTimeout(id)
  }, [onClose])

  return (
    <div className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-lg backdrop-blur ${STYLE[t.tone]}`}>
      <Icon size={16} className="shrink-0 mt-0.5" />
      <span className="flex-1 leading-snug">{t.text}</span>
      <button onClick={onClose} aria-label="Dismiss" className="shrink-0 opacity-60 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastHost({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])

  const push = useCallback((text: string, tone: Tone = 'ok') => {
    // Date.now() collides when two toasts fire in the same tick; the random suffix keeps keys unique.
    const id = Date.now() + Math.random()
    setItems((p) => [...p.slice(-2), { id, text, tone }])
  }, [])

  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 z-50 mx-auto flex max-w-md flex-col gap-2 px-4" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
        {items.map((t) => (
          <Item key={t.id} t={t} onClose={() => setItems((p) => p.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </Ctx.Provider>
  )
}
