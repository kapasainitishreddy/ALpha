import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { BANNED_PHRASES } from '@/data/disclaimers'

// Greps all source files for banned marketing/safety phrases. Acceptance criteria #24.
// Note: BANNED_PHRASES itself is the allow-listed definition file, so we skip disclaimers.ts.
function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}

describe('safety copy', () => {
  it('no banned phrases appear in source (except their definition)', () => {
    // Only scan shipped source (not test files). Skip files whose JOB is to define/forbid the phrases.
    const allowlist = ['disclaimers.ts', 'strategyOnlyGuardrail.ts', 'financeTutorSystemPrompt.ts']
    const files = walk(join(process.cwd(), 'src')).filter(
      (f) => !/\.test\.tsx?$/.test(f) && !allowlist.some((a) => f.endsWith(a)),
    )
    const offenders: string[] = []
    for (const f of files) {
      const text = readFileSync(f, 'utf8').toLowerCase()
      for (const banned of BANNED_PHRASES) {
        if (text.includes(banned.toLowerCase())) offenders.push(`${banned} -> ${f}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
