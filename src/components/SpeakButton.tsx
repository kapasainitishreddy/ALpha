import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { isSpeaking, speak, speechAvailable, stopSpeaking } from '@/lib/speech'

// Small "read this aloud" control. Renders nothing when the device has no speech synthesis
// rather than showing a button that does nothing.
export function SpeakButton({ text, label = 'Listen' }: { text: string; label?: string }) {
  const [on, setOn] = useState(false)

  // Speech has no reliable "ended" event across mobile browsers, so poll while active.
  useEffect(() => {
    if (!on) return
    const id = setInterval(() => { if (!isSpeaking()) setOn(false) }, 400)
    return () => clearInterval(id)
  }, [on])

  // Never leave audio running after the user navigates away.
  useEffect(() => () => stopSpeaking(), [])

  if (!speechAvailable()) return null

  return (
    <button
      className="chip flex items-center gap-1 !text-accent !border-accent/40"
      onClick={() => {
        if (on) { stopSpeaking(); setOn(false) }
        else { speak(text); setOn(true) }
      }}
      aria-label={on ? 'Stop reading' : `${label} — read aloud`}
    >
      {on ? <VolumeX size={12} /> : <Volume2 size={12} />}
      {on ? 'Stop' : label}
    </button>
  )
}
