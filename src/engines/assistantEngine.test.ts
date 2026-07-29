import { describe, expect, it } from 'vitest'
import { ask, suggestionsFor } from './assistantEngine'

describe('assistant', () => {
  it('answers the most important question unambiguously', () => {
    for (const q of ['can i buy real shares?', 'is this real money', 'can I actually buy stocks with this']) {
      const a = ask(q)
      expect(a.confident, q).toBe(true)
      expect(a.text, q).toMatch(/^No\.|cannot buy or sell anything real/i)
    }
  })

  it('explains how to place a mock trade', () => {
    const a = ask('how do i place a trade')
    expect(a.topicId).toBe('how-to-mock-trade')
    expect(a.text).toMatch(/Manual Trade/)
  })

  it('handles the swarm complaint in the user\'s own words', () => {
    const a = ask('the swarm is doing nothing')
    expect(a.confident).toBe(true)
    expect(a.text).toMatch(/capital|50,000|trigger/i)
  })

  it('explains a blocked trade', () => {
    expect(ask('why was my trade blocked').topicId).toBe('risk-guard')
  })

  it('returns Telugu-English text in Father Mode', () => {
    const plain = ask('what is a stop loss')
    const father = ask('what is a stop loss', { fatherMode: true })
    expect(father.text).not.toBe(plain.text)
    expect(father.text).toMatch(/cheyy|kavali|ante|lekunda/i)
  })

  it('refuses off-topic questions instead of guessing', () => {
    const a = ask('what is the capital of France')
    expect(a.text).toMatch(/trading|risk|strategies/i)
    expect(a.topicId).toBeNull()
  })

  it('admits when it has no answer rather than inventing one', () => {
    const a = ask('explain the quantum arbitrage flux strategy for nifty')
    if (!a.confident) {
      expect(a.text).toMatch(/don't have a written answer|not a full AI/i)
      expect(a.followUps.length).toBeGreaterThan(0)
    }
  })

  it('never returns an empty follow-up list when unsure', () => {
    expect(ask('').followUps.length).toBeGreaterThan(0)
    expect(ask('asdfghjkl qwerty').followUps.length).toBeGreaterThan(0)
  })

  // Regressions from real questions that returned confidently wrong answers.
  it('matches "mock trading" to the how-to topic, not a random strategy doc', () => {
    // "trading" alone used to pull in "Pairs Trading Simulation".
    for (const q of ['how do i do mock trading', 'how to do mock trading', 'how do i mock trade']) {
      expect(ask(q).topicId, q).toBe('how-to-mock-trade')
    }
  })

  it('distinguishes "swarm did nothing" from "what is the swarm"', () => {
    // The rare word "nothing" must outweigh the common word "swarm".
    for (const q of ['why is the swarm doing nothing', 'the swarm is doing nothing', 'swarm did nothing']) {
      expect(ask(q).topicId, q).toBe('swarm-no-trades')
    }
    expect(ask('what is the strategy swarm').topicId).toBe('swarm-explained')
  })

  it('tolerates ordinary word-ending differences', () => {
    expect(ask('why was my order blocked').topicId).toBe('risk-guard')
    expect(ask('what are stop losses').topicId).toBe('stop-loss')
  })

  it('offers screen-specific suggestions', () => {
    expect(suggestionsFor('/swarm').join(' ')).toMatch(/Swarm/i)
    expect(suggestionsFor('/options').join(' ')).toMatch(/option/i)
  })
})
