import { useState, type ReactNode } from 'react'
import { Lock as LockIcon } from 'lucide-react'

// Gates the app behind a shared passcode set at deploy time (VITE_APP_PASSCODE).
// Not encryption, just keeps the app private to people you've shared the code with.
// If no passcode is configured, the app is open (dev / public use).
const PASSCODE = import.meta.env.VITE_APP_PASSCODE as string | undefined
const UNLOCK_KEY = 'blackscythe-unlocked'

export function Lock({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(
    () => !PASSCODE || localStorage.getItem(UNLOCK_KEY) === '1',
  )
  const [input, setInput] = useState('')
  const [wrong, setWrong] = useState(false)

  if (unlocked) return <>{children}</>

  const submit = () => {
    if (input === PASSCODE) {
      localStorage.setItem(UNLOCK_KEY, '1')
      setUnlocked(true)
    } else {
      setWrong(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-xs text-center space-y-4">
        <LockIcon size={32} strokeWidth={1.5} className="mx-auto text-accent" />
        <div className="font-bold">BlackScythe Alpha</div>
        <div className="text-xs text-muted">Private practice app. Enter the passcode to continue.</div>
        <input
          className="input text-center"
          type="password"
          placeholder="Passcode"
          value={input}
          onChange={(e) => { setInput(e.target.value); setWrong(false) }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoFocus
        />
        {wrong && <div className="text-xs text-down">Wrong passcode.</div>}
        <button className="btn-primary w-full" onClick={submit}>Unlock</button>
      </div>
    </div>
  )
}
