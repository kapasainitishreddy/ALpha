// Read coaching aloud. Matters for a low-literacy or vision-impaired user far more than it
// matters as a feature — the whole app is aimed at someone who may find dense English hard.
// Uses the browser's built-in speech synthesis: free, offline, no key, no dependency.

export function speechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

// Prefer an Indian-English or Telugu voice when the device has one; fall back to any English.
function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  return (
    voices.find((v) => v.lang === 'te-IN') ??
    voices.find((v) => v.lang === 'en-IN') ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices[0]
  )
}

export function speak(text: string, opts: { rate?: number } = {}): void {
  if (!speechAvailable() || !text.trim()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const v = pickVoice()
  if (v) {
    u.voice = v
    u.lang = v.lang
  }
  // Slightly slow — this is instructional content, and the coach text mixes English with Telugu.
  u.rate = opts.rate ?? 0.92
  window.speechSynthesis.speak(u)
}

export function stopSpeaking(): void {
  if (speechAvailable()) window.speechSynthesis.cancel()
}

export function isSpeaking(): boolean {
  return speechAvailable() && window.speechSynthesis.speaking
}
