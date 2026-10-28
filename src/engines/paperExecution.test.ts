import { describe, expect, it } from 'vitest'
import { stopTriggered } from './paperExecution'

describe('paper stop trigger boundary', () => {
  it('activates a buy stop when price reaches or exceeds its trigger', () => {
    expect(stopTriggered('buy', 100, 100)).toBe(true)
    expect(stopTriggered('buy', 101, 100)).toBe(true)
    expect(stopTriggered('buy', 99.99, 100)).toBe(false)
  })

  it('activates a sell stop when price reaches or falls below its trigger', () => {
    expect(stopTriggered('sell', 100, 100)).toBe(true)
    expect(stopTriggered('sell', 99, 100)).toBe(true)
    expect(stopTriggered('sell', 100.01, 100)).toBe(false)
  })
})
