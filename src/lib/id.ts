// Identifiers for local paper records, including browsers opened over a local LAN.
// These are not authentication tokens.
export function localId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  if (globalThis.crypto?.getRandomValues) {
    const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 15) | 64
    bytes[8] = (bytes[8] & 63) | 128
    return [...bytes].map((b,i) => `${[4,6,8,10].includes(i) ? '-' : ''}${b.toString(16).padStart(2,'0')}`).join('')
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
