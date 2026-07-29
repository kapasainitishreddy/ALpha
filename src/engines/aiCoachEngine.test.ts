import { describe, expect, it } from 'vitest'
import { askCoach } from './aiCoachEngine'
import { BANNED_PHRASES } from '@/data/disclaimers'

describe('aiCoachEngine', () => {
  it('answers on-topic questions from the knowledge base', () => {
    const r = askCoach('what is a stop loss?')
    expect(r.source).toBe('knowledge-base')
    expect(r.text.toLowerCase()).toContain('stop loss')
  })

  it('refuses off-topic questions', () => {
    const r = askCoach('write me a romantic poem')
    expect(r.source).toBe('refusal')
  })

  it('explains why a trade was blocked', () => {
    const r = askCoach('why did the app reject my trade?')
    expect(r.text.toLowerCase()).toContain('risk guard')
  })

  it('returns father-mode phrasing when requested', () => {
    const r = askCoach('stop loss', true)
    expect(r.text).toContain('capital')
  })

  it('never emits a banned phrase', () => {
    const questions = ['stop loss', 'swarm', 'backtest', 'nifty', 'position size', 'risk reward']
    for (const q of questions) {
      const r = askCoach(q)
      const text = `${r.text} ${r.fatherText ?? ''}`.toLowerCase()
      for (const banned of BANNED_PHRASES) {
        expect(text.includes(banned.toLowerCase())).toBe(false)
      }
    }
  })
})
