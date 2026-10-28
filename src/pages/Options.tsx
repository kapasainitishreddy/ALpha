import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, TriangleAlert } from 'lucide-react'
import { Banner, Field, Section, Stat } from '@/components/common'
import { MOCK_SYMBOLS } from '@/data/mockSymbols'
import { maxLoss, payoffCurve, priceOption, strikeLadder, type OptType } from '@/lib/options'
import { inr, pnlColor } from '@/lib/format'
import { useTranslation } from '@/lib/i18n'

// Indian lot sizes are instrument-specific; these are illustrative round numbers, not exchange data.
const LOT: Record<string, number> = { NIFTY50: 75, BANKNIFTY: 35, RELIANCE: 500, TCS: 175, INFY: 400, HDFCBANK: 550 }
const OPTIONABLE = ['NIFTY50', 'BANKNIFTY', 'RELIANCE', 'TCS', 'INFY', 'HDFCBANK']
const OPTIONS_COPY = {
  seiStudy: {
    en: 'SEBI reported 93% of individual traders in the equity F&O segment incurred losses during FY22–FY24. That describes the studied group and period, not your outcome or every strategy.',
    te: 'FY22–FY24లో ఈక్విటీ F&O విభాగంలోని వ్యక్తిగత ట్రేడర్లలో 93% నష్టపోయారని SEBI నివేదించింది. ఇది పరిశీలించిన సమూహం, కాలానికి సంబంధించినది; మీ ఫలితాన్ని లేదా ప్రతి వ్యూహాన్ని సూచించదు.',
    hi: 'SEBI के अनुसार FY22–FY24 में इक्विटी F&O क्षेत्र के 93% व्यक्तिगत ट्रेडरों को नुकसान हुआ। यह अध्ययन किए गए समूह और अवधि का आँकड़ा है; आपका परिणाम या हर रणनीति नहीं।',
  },
  modelOnly: {
    en: 'Options can expire worthless; values and examples here are hypothetical.',
    te: 'ఆప్షన్లు విలువ లేకుండా గడువు ముగియవచ్చు; ఇక్కడి విలువలు, ఉదాహరణలు కల్పితం.',
    hi: 'ऑप्शन बेकार समाप्त हो सकते हैं; यहाँ के मूल्य और उदाहरण काल्पनिक हैं।',
  },
  labels: {
    premium: { en: 'Modeled premium (pre-costs)', te: 'నమూనా ప్రీమియం (ఖర్చులకు ముందు)', hi: 'मॉडल प्रीमियम (खर्च से पहले)' },
    maxLoss: { en: 'Max modeled loss (pre-costs)', te: 'గరిష్ఠ నమూనా నష్టం (ఖర్చులకు ముందు)', hi: 'अधिकतम मॉडल नुकसान (खर्च से पहले)' },
    expiryVol: { en: 'Expiry & volatility', te: 'గడువు మరియు వోలాటిలిటీ', hi: 'समाप्ति और वोलैटिलिटी' },
    days: (value: number) => ({ en: `Days to expiry — ${value}`, te: `గడువుకు మిగిలిన రోజులు — ${value}`, hi: `समाप्ति तक दिन — ${value}` }),
    iv: (value: number) => ({ en: `Implied volatility — ${value}%`, te: `ఇంప్లైడ్ వోలాటిలిటీ — ${value}%`, hi: `इम्प्लाइड वोलैटिलिटी — ${value}%` }),
    call: { en: 'Call option', te: 'కాల్ ఆప్షన్', hi: 'कॉल ऑप्शन' },
    put: { en: 'Put option', te: 'పుట్ ఆప్షన్', hi: 'पुट ऑप्शन' },
  },
  netBoundaries: {
    en: 'Modeled premium is',
    te: 'నమూనా ప్రీమియం',
    hi: 'मॉडल प्रीमियम',
  },
  netBoundariesTail: {
    en: (cost: string) => `At expiry, a long option can lose some or all of its gross premium of ${cost}; transaction costs can increase net loss. A move percentage is not a probability or forecast.`,
    te: (cost: string) => `గడువు నాడు లాంగ్ ఆప్షన్ స్థూల ప్రీమియం ${cost}లో కొంత లేదా మొత్తం కోల్పోవచ్చు; లావాదేవీ ఖర్చులు నికర నష్టాన్ని పెంచవచ్చు. కదలిక శాతం సంభావ్యత లేదా అంచనా కాదు.`,
    hi: (cost: string) => `समाप्ति पर लॉन्ग ऑप्शन अपना कुछ या पूरा सकल प्रीमियम ${cost} खो सकता है; लेनदेन खर्च शुद्ध नुकसान बढ़ा सकते हैं। चाल का प्रतिशत संभावना या पूर्वानुमान नहीं है।`,
  },
  theta: {
    en: 'Theta estimates sensitivity to time in this pricing model; it is not constant. Spot and implied volatility can offset or outweigh a time change. This model premium is hypothetical.',
    te: 'ఈ ధర నమూనాలో సమయానికి ఉన్న సున్నితత్వాన్ని థీటా అంచనా వేస్తుంది; అది స్థిరం కాదు. స్పాట్, ఇంప్లైడ్ వోలాటిలిటీ మార్పులు సమయ ప్రభావాన్ని తగ్గించవచ్చు లేదా మించవచ్చు. ఈ ప్రీమియం కల్పితం.',
    hi: 'इस मूल्य मॉडल में थीटा समय के प्रति संवेदनशीलता का अनुमान है; यह स्थिर नहीं। स्पॉट और इम्प्लाइड वोलैटिलिटी समय के असर को घटा या पार कर सकते हैं। यह मॉडल प्रीमियम काल्पनिक है।',
  },
  syntheticExample: {
    en: 'Synthetic model example (before costs): a call with spot ₹100, strike ₹100, 30 days, IV 20%, flat rate 6.5% is priced at ₹2.557356. Next day at spot ₹101, 29 days and the same IV, it is ₹3.092236. Spot ₹101 is still below the ₹102.557356 expiry break-even, yet modeled resale value rose. This is not an actual quote, fill or promised return.',
    te: 'కల్పిత నమూనా ఉదాహరణ (ఖర్చులకు ముందు): స్పాట్ ₹100, స్ట్రైక్ ₹100, 30 రోజులు, IV 20%, స్థిర రేటు 6.5% ఉన్న కాల్ ధర ₹2.557356. మరుసటి రోజు స్పాట్ ₹101, 29 రోజులు, అదే IV వద్ద ధర ₹3.092236. ₹101 స్పాట్ ₹102.557356 గడువు బ్రేక్-ఈవెన్ కంటే తక్కువే, అయినా నమూనా పునర్విక్రయ విలువ పెరిగింది. ఇది నిజమైన కోట్, అమలు లేదా లాభ హామీ కాదు.',
    hi: 'काल्पनिक मॉडल उदाहरण (खर्च से पहले): स्पॉट ₹100, स्ट्राइक ₹100, 30 दिन, IV 20%, स्थिर दर 6.5% वाले कॉल का मूल्य ₹2.557356 है। अगले दिन स्पॉट ₹101, 29 दिन और वही IV होने पर मूल्य ₹3.092236 है। ₹101 स्पॉट ₹102.557356 के समाप्ति ब्रेक-ईवन से नीचे है, फिर भी मॉडल पुनर्विक्रय मूल्य बढ़ा। यह वास्तविक भाव, भराव या लाभ का वादा नहीं।',
  },
  breakEven: {
    en: (kind: OptType, value: string) => `At expiry only and before transaction costs, this long ${kind} has a modeled break-even ${kind === 'call' ? 'above' : 'below'} ${value}. Before expiry, resale/mark value can change with spot, time and IV; this break-even does not predict resale P/L or an executable fill.`,
    te: (kind: OptType, value: string) => `గడువు రోజున మాత్రమే, లావాదేవీ ఖర్చులకు ముందు, ఈ లాంగ్ ${kind === 'call' ? 'కాల్' : 'పుట్'} నమూనా బ్రేక్-ఈవెన్ ${kind === 'call' ? 'పైగా' : 'కంటే తక్కువగా'} ${value}. గడువుకు ముందు పునర్విక్రయ/మార్క్ విలువ స్పాట్, సమయం, IVతో మారవచ్చు; ఈ స్థాయి పునర్విక్రయ P/L లేదా అమలును అంచనా వేయదు.`,
    hi: (kind: OptType, value: string) => `केवल समाप्ति पर और लेनदेन खर्च से पहले, इस लॉन्ग ${kind === 'call' ? 'कॉल' : 'पुट'} का मॉडल ब्रेक-ईवन ${kind === 'call' ? 'ऊपर' : 'नीचे'} ${value} है। समाप्ति से पहले पुनर्विक्रय/मार्क मूल्य स्पॉट, समय और IV से बदल सकता है; यह स्तर पुनर्विक्रय P/L या निष्पादन का अनुमान नहीं देता।`,
  },
  grossPremiumLoss: {
    en: 'Premium and maximum-loss figures are theoretical gross amounts: for a long option, premium × modeled units is the expiry payoff loss before transaction costs. This calculator excludes bid–ask spread, brokerage, taxes, exit slippage and real liquidity; actual total cost/loss may differ.',
    te: 'ప్రీమియం, గరిష్ఠ నష్టం విలువలు సిద్ధాంతపరమైన స్థూల మొత్తాలు: లాంగ్ ఆప్షన్‌కు ప్రీమియం × మోడల్ యూనిట్లు అనేది లావాదేవీ ఖర్చులకు ముందు గడువు పే-ఆఫ్ నష్టం. బిడ్–ఆస్క్ స్ప్రెడ్, బ్రోకరేజ్, పన్నులు, ఎగ్జిట్ స్లిపేజ్, నిజమైన లిక్విడిటీ ఈ కాలిక్యులేటర్‌లో లేవు; మొత్తం ఖర్చు/నష్టం మారవచ్చు.',
    hi: 'प्रीमियम और अधिकतम नुकसान सैद्धांतिक सकल रकम हैं: लॉन्ग ऑप्शन में प्रीमियम × मॉडल यूनिट, लेनदेन खर्च से पहले समाप्ति पेऑफ का नुकसान है। यह कैलकुलेटर बिड–आस्क स्प्रेड, ब्रोकरेज, कर, एग्जिट स्लिपेज और वास्तविक लिक्विडिटी शामिल नहीं करता; कुल लागत/नुकसान अलग हो सकता है।',
  },
  execution: {
    en: 'The chart is a European-style expiry payoff model, not an execution simulator. It does not model exercise/assignment, delivery, executable bid/ask prices or fills; actual contract rules vary by product. No order is sent.',
    te: 'ఈ చార్ట్ యూరోపియన్-శైలి గడువు పే-ఆఫ్ నమూనా; అమలు సిమ్యులేటర్ కాదు. ఎక్సర్సైజ్/అసైన్‌మెంట్, డెలివరీ, అమలయ్యే బిడ్/ఆస్క్ ధరలు లేదా ఫిల్లులు మోడల్ చేయదు; నిజమైన కాంట్రాక్ట్ నియమాలు ఉత్పత్తి ప్రకారం మారుతాయి. ఆర్డర్ పంపబడదు.',
    hi: 'यह चार्ट यूरोपीय-शैली समाप्ति पेऑफ मॉडल है, निष्पादन सिम्युलेटर नहीं। एक्सरसाइज/असाइनमेंट, डिलीवरी, निष्पादन योग्य बिड/आस्क भाव या भराव मॉडल नहीं होते; वास्तविक अनुबंध नियम उत्पाद के अनुसार अलग हैं। कोई ऑर्डर नहीं भेजा जाता।',
  },
  multiplier: {
    en: (units: number) => `Teaching multiplier: ${units} modeled units per app “lot”. This illustrative value is not a current exchange contract size or lot quantity.`,
    te: (units: number) => `బోధనా గుణకం: యాప్ “లాట్”కు ${units} మోడల్ యూనిట్లు. ఈ కల్పిత విలువ ప్రస్తుతం ఉన్న ఎక్స్చేంజ్ కాంట్రాక్ట్ పరిమాణం లేదా లాట్ సంఖ్య కాదు.`,
    hi: (units: number) => `शिक्षण गुणक: ऐप के “लॉट” में ${units} मॉडल यूनिट। यह उदाहरण मूल्य वर्तमान एक्सचेंज अनुबंध आकार या लॉट मात्रा नहीं है।`,
  },
  valueNote: {
    en: (time: string, premium: string) => `The model assigns ₹${time} of this ₹${premium} premium to time value. It may change as time, spot and IV change, and can be zero at expiry; it is not a guaranteed daily loss.`,
    te: (time: string, premium: string) => `ఈ ₹${premium} ప్రీమియంలో ₹${time}ను నమూనా సమయ విలువగా చూపుతుంది. సమయం, స్పాట్, IV మారితే అది మారవచ్చు; గడువున సున్నా కావచ్చు. ఇది రోజువారీ నష్ట హామీ కాదు.`,
    hi: (time: string, premium: string) => `इस ₹${premium} प्रीमियम में ₹${time} को मॉडल समय-मूल्य मानता है। समय, स्पॉट और IV बदलने पर यह बदल सकता है और समाप्ति पर शून्य हो सकता है; यह रोज़ के नुकसान की गारंटी नहीं।`,
  },
  intrinsicNote: {
    en: (cost: string) => `Most modeled premium is intrinsic value. It is still a theoretical mark, not an executable quote; the up-front gross premium is ₹${cost}, before transaction costs.`,
    te: (cost: string) => `నమూనా ప్రీమియంలో ఎక్కువ భాగం అంతర్గత విలువ. ఇది అమలయ్యే కోట్ కాదు, సిద్ధాంతపరమైన మార్క్ మాత్రమే; లావాదేవీ ఖర్చులకు ముందు స్థూల ప్రీమియం ₹${cost}.`,
    hi: (cost: string) => `मॉडल प्रीमियम का अधिक भाग आंतरिक मूल्य है। यह निष्पादन योग्य भाव नहीं, सैद्धांतिक मूल्य है; लेनदेन खर्च से पहले सकल प्रीमियम ₹${cost} है।`,
  },
} as const

function PayoffChart({ points, spot, breakeven }: { points: { price: number; pnl: number }[]; spot: number; breakeven: number }) {
  const W = 300
  const H = 120
  const pnls = points.map((p) => p.pnl)
  const min = Math.min(...pnls)
  const max = Math.max(...pnls)
  const span = max - min || 1
  const xs = points.map((p) => p.price)
  const xMin = Math.min(...xs)
  const xSpan = Math.max(...xs) - xMin || 1

  const x = (p: number) => ((p - xMin) / xSpan) * W
  const y = (v: number) => H - ((v - min) / span) * H
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(p.price)} ${y(p.pnl)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Profit and loss at expiry across prices">
      <line x1="0" y1={y(0)} x2={W} y2={y(0)} stroke="#30363d" strokeDasharray="3 3" />
      <line x1={x(spot)} y1="0" x2={x(spot)} y2={H} stroke="#4da3ff" strokeWidth="1" opacity="0.5" />
      <line x1={x(breakeven)} y1="0" x2={x(breakeven)} y2={H} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
      <path d={d} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  )
}

export default function Options() {
  const { language } = useTranslation()
  const [symbol, setSymbol] = useState('NIFTY50')
  const [type, setType] = useState<OptType>('call')
  const [days, setDays] = useState(7)
  const [iv, setIv] = useState(18)
  const [lots, setLots] = useState(1)
  const [strike, setStrike] = useState<number | null>(null)

  const spot = MOCK_SYMBOLS.find((m) => m.symbol === symbol)?.basePrice ?? 1000
  const lotSize = LOT[symbol] ?? 100
  const ladder = useMemo(() => strikeLadder(spot), [spot])
  const active = strike ?? ladder[Math.floor(ladder.length / 2)]

  const chain = useMemo(
    () => ladder.map((k) => ({ call: priceOption(spot, k, 'call', days, iv), put: priceOption(spot, k, 'put', days, iv) })),
    [ladder, spot, days, iv],
  )
  const q = useMemo(() => priceOption(spot, active, type, days, iv), [spot, active, type, days, iv])
  const curve = useMemo(() => payoffCurve(q, lots, lotSize, spot), [q, lots, lotSize, spot])
  const cost = q.premium * lots * lotSize
  const movePct = ((q.breakeven - spot) / spot) * 100

  return (
    <div className="space-y-6">
      <Banner tone="warn">
        <b>{OPTIONS_COPY.modelOnly[language]}</b>{' '}
        {OPTIONS_COPY.seiStudy[language]}{' '}
        <a
          className="underline"
          href="https://www.sebi.gov.in/media-and-notifications/press-releases/sep-2024/updated-sebi-study-reveals-93-of-individual-traders-incurred-losses-in-equity-fando-between-fy22-and-fy24-aggregate-losses-exceed-1-8-lakh-crores-over-three-years_86906.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          SEBI study (23 Sep 2024)
        </a>
      </Banner>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Instrument">
          <select className="input" value={symbol} onChange={(e) => { setSymbol(e.target.value); setStrike(null) }}>
            {OPTIONABLE.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Lots">
          <input className="input" type="number" min={1} max={10} value={lots} onChange={(e) => setLots(Math.max(1, Math.min(10, +e.target.value)))} />
        </Field>
      </div>
      <p className="text-xs text-muted">{OPTIONS_COPY.multiplier[language](lotSize)}</p>

      <div className="flex gap-2">
        <button className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${type === 'call' ? 'bg-up text-bg' : 'bg-panel2 text-muted border border-edge'}`} onClick={() => setType('call')}>
          {OPTIONS_COPY.labels.call[language]}
        </button>
        <button className={`flex-1 rounded-xl py-2.5 text-sm font-semibold ${type === 'put' ? 'bg-down text-bg' : 'bg-panel2 text-muted border border-edge'}`} onClick={() => setType('put')}>
          {OPTIONS_COPY.labels.put[language]}
        </button>
      </div>

      <Section title="Option chain">
        <div className="card !p-0 overflow-hidden">
          <div className="grid grid-cols-3 px-3 py-2 text-[10px] uppercase tracking-wide text-muted border-b border-edge">
            <span>Call</span><span className="text-center">Strike</span><span className="text-right">Put</span>
          </div>
          {chain.map(({ call, put }, i) => {
            const k = ladder[i]
            const atm = Math.abs(k - spot) < (ladder[1] - ladder[0]) / 2
            return (
              <button
                key={k}
                onClick={() => setStrike(k)}
                className={`grid grid-cols-3 w-full px-3 py-2 text-sm border-b border-edge/40 last:border-0 transition ${
                  k === active ? 'bg-accent/10' : ''
                } ${atm ? 'font-semibold' : ''}`}
              >
                <span className={call.moneyness === 'ITM' ? 'text-up text-left' : 'text-muted text-left'}>{call.premium.toFixed(1)}</span>
                <span className={`text-center ${atm ? 'text-accent' : ''}`}>{k}{atm ? ' •' : ''}</span>
                <span className={put.moneyness === 'ITM' ? 'text-down text-right' : 'text-muted text-right'}>{put.premium.toFixed(1)}</span>
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-muted">
          Spot {inr(spot)} · dot marks at-the-money · green/red = already in the money
        </p>
      </Section>

      <Section title={OPTIONS_COPY.labels.expiryVol[language]}>
        <Field label={OPTIONS_COPY.labels.days(days)[language]}>
          <input type="range" min={1} max={45} value={days} onChange={(e) => setDays(+e.target.value)} className="w-full accent-accent" />
        </Field>
        <Field label={OPTIONS_COPY.labels.iv(iv)[language]}>
          <input type="range" min={8} max={60} value={iv} onChange={(e) => setIv(+e.target.value)} className="w-full accent-accent" />
        </Field>
        <p className="flex gap-1.5 text-[11px] text-muted leading-relaxed">
          <Info size={12} className="shrink-0 mt-0.5 text-accent" />
          {OPTIONS_COPY.theta[language]}
        </p>
      </Section>

      <Section title={`${symbol} ${active} ${type.toUpperCase()}`}>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Premium" value={`₹${q.premium.toFixed(1)}`} />
          <Stat label={OPTIONS_COPY.labels.premium[language]} value={inr(cost)} />
          <Stat label={OPTIONS_COPY.labels.maxLoss[language]} value={inr(-maxLoss(q, lots, lotSize))} tone={-1} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Intrinsic" value={`₹${q.intrinsic.toFixed(1)}`} />
          <Stat label="Time value" value={`₹${q.timeValue.toFixed(1)}`} />
          <Stat label="Delta" value={q.delta.toFixed(2)} />
        </div>

        <div className="card !p-3">
          <PayoffChart points={curve} spot={spot} breakeven={q.breakeven} />
          <div className="flex justify-between text-[10px] text-muted mt-1">
            <span>{inr(curve[0].price)}</span>
            <span className="text-accent">spot {inr(spot)}</span>
            <span>{inr(curve[curve.length - 1].price)}</span>
          </div>
        </div>

        <Banner tone={Math.abs(movePct) > 2 ? 'warn' : 'info'}>
          {OPTIONS_COPY.breakEven[language](type, inr(q.breakeven))} {OPTIONS_COPY.netBoundaries[language]} {inr(cost)}
          {' '}{language === 'en' ? 'before transaction costs.' : language === 'te' ? 'లావాదేవీ ఖర్చులకు ముందు.' : 'लेनदेन खर्च से पहले।'}{' '}
          {OPTIONS_COPY.netBoundariesTail[language](inr(cost))}
        </Banner>

        <div className="card !p-3 flex gap-2">
          <TriangleAlert size={15} className="text-warn shrink-0 mt-0.5" />
          <p className="text-xs text-muted leading-relaxed">
            {q.timeValue > q.intrinsic
              ? OPTIONS_COPY.valueNote[language](q.timeValue.toFixed(1), q.premium.toFixed(1))
              : OPTIONS_COPY.intrinsicNote[language](inr(cost))}
          </p>
        </div>
        <div className="card space-y-2 text-xs text-muted leading-relaxed">
          <p>{OPTIONS_COPY.syntheticExample[language]}</p>
          <p>{OPTIONS_COPY.grossPremiumLoss[language]}</p>
          <p>{OPTIONS_COPY.execution[language]}</p>
        </div>
      </Section>

      <Banner tone="lock">
        Educational calculator only. Uses one flat volatility input and a simplified model — real premiums
        differ. No option is bought or sold on this calculator. Try virtual positions in the futures & options practice lab.
        <Link to="/derivatives" className="underline">Open derivatives practice</Link>. Learn position sizing in <Link to="/risk" className="underline">Risk Tools</Link> before going near these.
      </Banner>
    </div>
  )
}
