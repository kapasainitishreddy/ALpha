import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n'
import {
  runExperiment,
  headlineSentiment,
  type Experiment,
  type ExperimentResult,
} from '@/lib/modelExperiments'
import { generateSession } from '@/engines/mockMarketEngine'
import { Sparkline } from '@/components/Sparkline'
import { Banner, Field, Section, Stat } from '@/components/common'
import { SymbolEventPicker } from '@/components/session'
import { inr } from '@/lib/format'
import { EXPERIMENT_ASSUMPTIONS, MODEL_RETURN_ASSUMPTIONS } from '@/data/practiceAssumptions'
const names: Record<Experiment, [string, string, string]> = {
  pairs: ['Pairs spread', 'పెయిర్ స్ప్రెడ్', 'पेयर स्प्रेड'],
  grid: ['Inventory grid', 'ఇన్వెంటరీ గ్రిడ్', 'इन्वेंटरी ग्रिड'],
  'market-making': [
    'Bid/ask market making',
    'బిడ్/ఆస్క్ మార్కెట్ మేకింగ్',
    'बिड/आस्क मार्केट मेकिंग',
  ],
  arbitrage: ['Two-venue arbitrage', 'రెండు మార్కెట్ల ఆర్బిట్రాజ్', 'दो बाजार आर्बिट्राज'],
  allocation: [
    'Inverse volatility allocation',
    'ఇన్వర్స్ వోలాటిలిటీ కేటాయింపు',
    'इन्वर्स वोलैटिलिटी आवंटन',
  ],
  regression: ['OLS return regression', 'OLS రిటర్న్ రిగ్రెషన్', 'OLS रिटर्न रिग्रेशन'],
  'q-learning': ['Tabular Q-learning', 'టాబులర్ Q-లెర్నింగ్', 'टैबुलर Q-लर्निंग'],
}
const isExperiment = (value: string): value is Experiment => Object.hasOwn(names, value)
export default function Models() {
  const { t, language } = useTranslation()
  const [params] = useSearchParams()
  const requested = params.get('kind') ?? 'pairs'
  const [kind, setKind] = useState<Experiment>(
    isExperiment(requested) ? requested : 'pairs',
  )
  useEffect(() => {
    setKind(isExperiment(requested) ? requested : 'pairs')
    setResult(null)
  }, [requested])
  const [symbol, setSymbol] = useState('INFY')
  const [event, setEvent] = useState('sideways')
  const [seed, setSeed] = useState(42)
  const [result, setResult] = useState<ExperimentResult | null>(null)
  const [headline, setHeadline] = useState(
    'Quarterly profit beat expectations, but regulator inquiry continues',
  )
  const sentiment = headlineSentiment(headline)
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{t('models')}</h1>
      <Banner>
        {t('paperNotice')}{' '}
        {language === 'te'
          ? 'ఇవి చిన్న విద్యా ప్రయోగాలు. నిజమైన మార్కెట్ లేదా సంస్థాగత రాబడికి సాక్ష్యం కాదు.'
          : language === 'hi'
            ? 'ये छोटे शैक्षिक प्रयोग हैं। वास्तविक बाजार या संस्थागत रिटर्न का प्रमाण नहीं।'
            : 'Small research experiments, separate from your paper account. No claim of institutional performance or secret models.'}
      </Banner>
      <Field label={t('models')}>
        <select
          className="input"
          value={kind}
          onChange={(e) => {
            setKind(e.target.value as Experiment)
            setResult(null)
          }}
        >
          {Object.entries(names).map(([id, n]) => (
            <option value={id} key={id}>
              {n[language === 'te' ? 1 : language === 'hi' ? 2 : 0]}
            </option>
          ))}
        </select>
      </Field>
      <Section
        title={
          language === 'te' ? 'మోడల్ ఊహలు మరియు పరిమితులు' : language === 'hi' ? 'मॉडल की धारणाएँ और सीमाएँ' : 'Model assumptions and limits'
        }
      >
        <div className="card space-y-3 text-sm leading-relaxed">
          <p>{MODEL_RETURN_ASSUMPTIONS[language]}</p>
          <p>{EXPERIMENT_ASSUMPTIONS[kind][language]}</p>
        </div>
      </Section>
      <SymbolEventPicker symbol={symbol} event={event} onSymbol={setSymbol} onEvent={setEvent} />
      <Field label="Deterministic seed">
        <input
          className="input"
          type="number"
          value={seed}
          onChange={(e) => setSeed(Number(e.target.value) || 0)}
        />
      </Field>
      <button
        className="btn-primary w-full"
        onClick={() =>
          setResult(runExperiment(kind, generateSession(symbol, event, 240, seed).candles, seed))
        }
      >
        {t('practice')}
      </button>
      {result && (
        <>
          <div className="card">
            <Sparkline data={result.equity} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Experiment P/L" value={inr(result.pnl)} tone={result.pnl} />
            <Stat label="Drawdown" value={`${result.drawdown.toFixed(2)}%`} />
            <Stat label="Cost model" value={inr(result.fees)} />
            <Stat label="Train bars" value={String(result.trainBars)} />
          </div>
          <Banner>{result.note}</Banner>
        </>
      )}
      <Section title="Headline keyword demo (English)">
        <textarea
          className="input"
          value={headline}
          maxLength={1000}
          onChange={(e) => setHeadline(e.target.value)}
        />
        <div className="text-sm">
          Score: {sentiment.score} · + {sentiment.positive.join(', ') || '—'} · −{' '}
          {sentiment.negative.join(', ') || '—'}
        </div>
        <p className="text-xs text-muted">
          Not FinBERT or an LLM. Ignores negation, context and market expectations. Not a stock
          recommendation.
        </p>
      </Section>
      <Link className="text-accent underline" to="/learn">
        {t('learn')} →
      </Link>
      <Link className="text-accent underline block" to="/research">
        {t('sources')} →
      </Link>
    </div>
  )
}
