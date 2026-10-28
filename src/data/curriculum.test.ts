import { describe, expect, it } from 'vitest'
import { CURRICULUM, getLessonChoiceOrder } from './curriculum'
import { LESSON_EXAMPLES } from './lessonExamples'
import { LESSON_WRONG_FEEDBACK } from './lessonFeedback'
import { EXPERIMENT_ASSUMPTIONS, MODEL_RETURN_ASSUMPTIONS, REPLAY_ASSUMPTIONS } from './practiceAssumptions'

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

  it('keeps critical execution, payoff and translation distinctions visible in every locale', () => {
    const lesson = (id: string) => CURRICULUM.find((l) => l.id === id)!
    for (const lang of languages) {
      expect(lesson('orders').body[lang]).toMatch(/trigger|ట్రిగ్గర్|ट्रिगर/i)
      expect(lesson('orders').body[lang]).toMatch(/reaches or exceeds|చేరినప్పుడు లేదా దాటినప్పుడు|చేరినప్పుడు|तक पहुँचने या उससे ऊपर/i)
      expect(lesson('trend').body[lang]).toMatch(/regimes|పరిస్థితుల్లో పరీక్షించండి|परिस्थितियों में जाँचें/i)
      expect(lesson('backtesting').body[lang]).toMatch(/corporate actions|కార్పొరేట్ చర్యలు|कॉर्पोरेट बदलाव/i)
      expect(lesson('spreads').body[lang]).toMatch(/same underlying|ఒకే అండర్లయింగ్|एक ही अंडरलाइंग/i)
      expect(lesson('spreads').body[lang]).toMatch(/same underlying, strike|ఒకే అండర్లయింగ్, స్ట్రైక్|उसी अंडरलाइंग, स्ट्राइक/i)
      expect(MODEL_RETURN_ASSUMPTIONS[lang]).toMatch(/not|కావు|नहीं/i)
      expect(REPLAY_ASSUMPTIONS[lang]).toMatch(/stop|స్టాప్|स्टॉप/i)
      for (const kind of ['pairs', 'grid', 'market-making', 'arbitrage', 'allocation', 'regression', 'q-learning'] as const) {
        expect(EXPERIMENT_ASSUMPTIONS[kind][lang].trim()).not.toBe('')
      }
    }
    const en = EXPERIMENT_ASSUMPTIONS
    expect(en.pairs.en).toMatch(/borrow.*covariance.*simultaneous/i)
    expect(en.grid.en).toMatch(/queue.*latency/i)
    expect(en['market-making'].en).toMatch(/invented.*queue.*latency/i)
    expect(en.arbitrage.en).toMatch(/8%.*invented.*not measured/i)
    expect(en.allocation.en).toMatch(/covariance.*rebalancing/i)
    expect(lesson('futures').body.en).toMatch(/collateral.*not the maximum loss/i)
    expect(lesson('spreads').body.en).toMatch(/exercise\/assignment risk/i)
    expect(lesson('ownership').body.en).toMatch(/issued shares/i)
    expect(lesson('ownership').body.en).toMatch(/outstanding shares/i)
    expect(lesson('ownership').body.te).toMatch(/జారీ చేసిన.*బకాయి/)
    expect(lesson('ownership').body.hi).toMatch(/जारी शेयर.*बकाया शेयर/)
    expect(lesson('spreads').source).toBe('https://www.optionseducation.org/strategies/all-strategies/bull-call-spread-debit-call-spread')
    expect(lesson('spreads').relatedSources?.[0].url).toBe('https://www.optionseducation.org/strategies/all-strategies/long-straddle')
    expect(lesson('portfolio').source).toBe('https://www.investor.gov/introduction-investing/getting-started/asset-allocation')
    expect(lesson('ownership').relatedSources?.[0].url).toBe('https://www.sec.gov/resources-small-businesses/glossary')
    expect(lesson('shorts').source).toBe('https://www.sec.gov/investor/pubs/regsho.htm')
    expect(lesson('shorts').relatedSources?.[0].url).toBe('https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/stock-purchases-and-sales-long-and')
    for (const id of ['options', 'futures', 'spreads']) {
      for (const lang of languages) expect(Object.keys(LESSON_WRONG_FEEDBACK[id][lang])).toEqual(['1', '2'])
    }
  })
})
