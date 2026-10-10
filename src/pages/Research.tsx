import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from '@/lib/i18n'
import { RESEARCH_SOURCES, OPEN_SOURCE_REFERENCES } from '@/data/researchSources'
import { Banner, Field, Section } from '@/components/common'
const copy = {
  en: {
    notice:
      'Public research tools help investigate stocks. No secret site or model establishes certain winners. Primary filings take precedence over posts and screenshots.',
    checklist: 'Thesis checklist',
    labels: [
      'Ticker and business',
      'Why the valuation is reasonable',
      'Primary filing and date',
      'Liquidity / spread',
      'What would invalidate this idea',
      'Maximum paper loss / position size',
    ],
    save: 'Save research note',
    saved: 'Saved on this device.',
    models: 'Open-source references (not all installed)',
    use: 'Use your note in paper practice',
  },
  te: {
    notice:
      'పబ్లిక్ టూల్స్ షేర్ల పరిశోధనకు సహాయం చేస్తాయి. రహస్య సైట్ లేదా మోడల్ ఖచ్చిత విజేతలు ఇవ్వదు. పోస్టుల కన్నా అసలు నివేదికలకు ప్రాధాన్యం.',
    checklist: 'అంచనా తనిఖీ జాబితా',
    labels: [
      'టిక్కర్ మరియు వ్యాపారం',
      'విలువ ఎందుకు సమంజసం',
      'అసలు నివేదిక మరియు తేదీ',
      'లిక్విడిటీ / స్ప్రెడ్',
      'ఈ ఆలోచన తప్పు కావడానికి కారణం',
      'గరిష్ఠ వర్చువల్ నష్టం / పరిమాణం',
    ],
    save: 'పరిశోధన నోట్ సేవ్',
    saved: 'ఈ పరికరంలో సేవ్ అయింది.',
    models: 'ఓపెన్ సోర్స్ సూచనలు (అన్నీ ఇన్‌స్టాల్ కాలేదు)',
    use: 'వర్చువల్ అభ్యాసంలో నోట్ వాడండి',
  },
  hi: {
    notice:
      'सार्वजनिक औजार शेयर शोध में मदद करते हैं। कोई गुप्त साइट या मॉडल निश्चित विजेता नहीं देता। पोस्ट और स्क्रीनशॉट से पहले मूल रिपोर्ट देखें.',
    checklist: 'धारणा जाँच सूची',
    labels: [
      'टिकर और कारोबार',
      'मूल्यांकन उचित क्यों है',
      'मूल रिपोर्ट और तारीख',
      'लिक्विडिटी / स्प्रेड',
      'यह विचार कब गलत होगा',
      'अधिकतम वर्चुअल नुकसान / आकार',
    ],
    save: 'शोध नोट सहेजें',
    saved: 'इस डिवाइस पर सहेजा गया.',
    models: 'ओपन सोर्स संदर्भ (सभी इंस्टॉल नहीं)',
    use: 'पेपर अभ्यास में नोट उपयोग करें',
  },
}
export default function Research() {
  const { t, language } = useTranslation()
  const c = copy[language]
  const [note, setNote] = useState<string[]>(() => {
    try {
      const n = JSON.parse(localStorage.getItem('alpha-research-note') ?? '[]')
      return Array.isArray(n) ? n.slice(0, 6).map(String) : []
    } catch {
      return []
    }
  })
  const [saved, setSaved] = useState(false)
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">{t('research')}</h1>
      <Banner>{c.notice}</Banner>
      <Section title={c.checklist}>
        {c.labels.map((label, i) => (
          <Field key={i} label={label}>
            <textarea
              className="input"
              maxLength={2000}
              value={note[i] ?? ''}
              onChange={(e) => {
                setSaved(false)
                setNote((n) =>
                  Array.from({ length: 6 }, (_, j) => (j === i ? e.target.value : (n[j] ?? ''))),
                )
              }}
            />
          </Field>
        ))}
        <button
          className="btn-primary w-full"
          onClick={() => {
            localStorage.setItem('alpha-research-note', JSON.stringify(note))
            setSaved(true)
          }}
        >
          {saved ? c.saved : c.save}
        </button>
        <Link to="/manual" className="text-accent underline text-sm">
          {c.use}
        </Link>
      </Section>
      <Section title={t('sources')}>
        {RESEARCH_SOURCES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="card block space-y-2"
          >
            <div className="font-bold text-accent">{s.name} ↗</div>
            <p className="text-xs text-muted">{s[language]}</p>
          </a>
        ))}
      </Section>
      <Section title={c.models}>
        {OPEN_SOURCE_REFERENCES.map((s) => (
          <a
            key={s.name}
            className="card block text-sm"
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="text-accent font-bold">{s.name} ↗</span>
            <p className="text-xs text-muted mt-1">
              {s.license} · {s.use}
            </p>
          </a>
        ))}
      </Section>
    </div>
  )
}
