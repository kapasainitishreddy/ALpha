import { describe, expect, it } from 'vitest'
import { CURRICULUM, getLessonChoiceOrder } from './curriculum'
import { LESSON_EXAMPLES } from './lessonExamples'

const languages = ['en', 'te', 'hi'] as const
const appRoutes = new Set([
  '/derivatives', '/replay', '/models', '/portfolio', '/learn', '/research', '/', '/father',
  '/coach', '/manual', '/assisted', '/auto', '/swarm', '/strategies', '/backtest', '/compound',
  '/journal', '/comparison', '/market', '/watchlist', '/settings/api', '/settings/ai',
  '/settings/llm', '/dataset', '/real', '/risk', '/live', '/progress', '/challenge', '/builder',
  '/debate', '/insights', '/options',
])
const experiments = new Set(['pairs', 'grid', 'market-making', 'arbitrage', 'allocation', 'regression', 'q-learning'])
const expectedTargets: Record<string, string> = {
  candles: '/replay?lesson=candles',
  backtesting: '/backtest',
  portfolio: '/models?kind=allocation',
  futures: '/derivatives',
  options: '/options',
  spreads: '/derivatives',
  pairs: '/models?kind=pairs',
  microstructure: '/models?kind=grid',
  arbitrage: '/models?kind=arbitrage',
  ml: '/models?kind=regression',
  rl: '/models?kind=q-learning',
}

describe('localized lessons and practice destinations', () => {
  it('has 24 complete lessons with a worked example in each language', () => {
    expect(CURRICULUM).toHaveLength(24)
    expect(new Set(CURRICULUM.map((lesson) => lesson.id)).size).toBe(24)
    for (const lesson of CURRICULUM) {
      expect(lesson.source).toMatch(/^https:\/\//)
      expect(lesson.correct).toBeGreaterThanOrEqual(0)
      for (const lang of languages) {
        expect(lesson.title[lang].trim()).not.toBe('')
        expect(lesson.body[lang].trim()).not.toBe('')
        expect(lesson.question[lang].trim()).not.toBe('')
        expect(lesson.answers[lang]).toHaveLength(3)
        expect(lesson.answers[lang][lesson.correct].trim()).not.toBe('')
        expect(LESSON_EXAMPLES[lesson.id]?.[lang].trim()).not.toBe('')
      }
    }
    expect(Object.keys(LESSON_EXAMPLES).sort()).toEqual(CURRICULUM.map((lesson) => lesson.id).sort())
  })

  it('keeps each localized correct answer selectable after choice rotation', () => {
    for (const [lessonIndex, lesson] of CURRICULUM.entries()) {
      for (const lang of languages) {
        const displayed = getLessonChoiceOrder(lessonIndex, lesson.answers[lang].length)
        expect(displayed).toHaveLength(lesson.answers[lang].length)
        expect(new Set(displayed).size).toBe(lesson.answers[lang].length)
        expect(displayed).toContain(lesson.correct)
        expect(lesson.answers[lang][lesson.correct]).toBeTruthy()
      }
    }
    expect(getLessonChoiceOrder(-1, 3)).toEqual([])
    expect(getLessonChoiceOrder(1, 0)).toEqual([])
  })

  it('targets a real screen and the intended experiment or lesson replay context', () => {
    for (const lesson of CURRICULUM) {
      const url = new URL(lesson.route, 'https://local.invalid')
      expect(appRoutes.has(url.pathname), `${lesson.id} route ${url.pathname}`).toBe(true)
      if (expectedTargets[lesson.id]) expect(lesson.route).toBe(expectedTargets[lesson.id])
      if (url.pathname === '/models') expect(experiments.has(url.searchParams.get('kind') ?? 'pairs')).toBe(true)
      if (url.pathname === '/replay') expect(url.searchParams.get('lesson')).toBe(lesson.id)
    }
  })
})
