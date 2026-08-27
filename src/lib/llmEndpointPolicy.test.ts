import { describe, expect, it } from 'vitest'
import { validateLlmEndpoint } from './llmEndpointPolicy'

describe('AI endpoint policy', () => {
  it('allows normal HTTPS providers', () => {
    expect(validateLlmEndpoint('https://api.example.com/v1/').baseUrl).toBe('https://api.example.com/v1')
  })

  it('allows plain HTTP only on loopback hosts', () => {
    expect(validateLlmEndpoint('http://localhost:11434/v1').local).toBe(true)
    expect(validateLlmEndpoint('http://127.0.0.1:11434/v1').local).toBe(true)
    expect(() => validateLlmEndpoint('http://ai.example.com/v1')).toThrow(/HTTPS/)
  })

  it('rejects credentials, query strings, fragments and non-HTTP schemes', () => {
    expect(() => validateLlmEndpoint('https://user:pass@example.com/v1')).toThrow()
    expect(() => validateLlmEndpoint('https://example.com/v1?token=x')).toThrow()
    expect(() => validateLlmEndpoint('https://example.com/v1#x')).toThrow()
    expect(() => validateLlmEndpoint('file:///tmp/model')).toThrow()
  })
})
