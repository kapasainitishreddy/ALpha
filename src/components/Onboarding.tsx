import { LANGUAGES, useTranslation, type Language } from '@/lib/i18n'
import { useStore } from '@/store/useStore'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Calculator, Lock, Network, ShieldCheck, UserRound } from 'lucide-react'

// First-run explainer. A beginner opening this app sees 20 screens and no idea where to start;
// four cards fix that. Shown once, dismissible, never blocks the app.

const STEPS = [
  {
    Icon: ShieldCheck,
    title: 'This is practice, not trading',
    body: 'Every rupee here is fake. There is no broker connected and no way to lose real money. Make your expensive mistakes on this screen instead of a real one.',
  },
  {
    Icon: Calculator,
    title: 'Learn to size before you learn to pick',
    body: 'Most beginners obsess over what to buy. What actually decides whether you survive is how much you buy. Risk Tools shows you the maths in one screen.',
  },
  {
    Icon: Network,
    title: 'Watch AI strategies disagree',
    body: 'Run the Strategy Swarm and five different strategies trade the same market at once. Seeing them disagree teaches more than any single winning trade.',
  },
  {
    Icon: UserRound,
    title: 'Father Mode for absolute beginners',
    body: 'Bigger buttons, tighter safety limits, and explanations in Telugu-English. Built for someone who has never traded before.',
  },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const { language } = useTranslation()
  const [i, setI] = useState(0)
  const navigate = useNavigate()
  const translations = {
    te: [
      ['ఇది అభ్యాసం మాత్రమే', 'ఇక్కడ డబ్బు వర్చువల్. బ్రోకర్ అనుసంధానం లేదు. లాభాలను తీసుకోలేరు. అసలు డబ్బు పెట్టే ముందు భావనలు, రిస్క్ నేర్చుకోండి.'],
      ['ముందుగా పరిమాణం నేర్చుకోండి', 'ఏది కొనాలి అన్నదానితో పాటు ఎంత కొనాలి అన్నది ముఖ్యం. నష్టం బడ్జెట్, స్టాప్ లాస్, ఖర్చులు నిర్ణయించండి. రిస్క్ టూల్స్‌లో లెక్కలు చూడండి.'],
      ['వ్యూహాలను పోల్చండి', 'ఒకే మార్కెట్‌లో వేర్వేరు వ్యూహాలు వేర్వేరు ఫలితాలు ఇస్తాయి. స్వార్మ్, బ్యాక్‌టెస్ట్, మోడల్ ల్యాబ్‌లో వాటి పరిమితులను తెలుసుకోండి.'],
      ['మీ భాషలో నేర్చుకోండి', 'తెలుగు, హిందీ, ఇంగ్లీష్ పాఠాలు, జ్ఞాన పరీక్షలు ఉన్నాయి. నాన్న మోడ్ పెద్ద బటన్లు, కఠిన రిస్క్ పరిమితులు ఇస్తుంది.'],
    ],
    hi: [
      ['यह केवल अभ्यास है', 'यहाँ पैसा वर्चुअल है। ब्रोकर जुड़ा नहीं है और लाभ निकाला नहीं जा सकता। असली पैसा लगाने से पहले अवधारणा और जोखिम सीखें.'],
      ['पहले पोजिशन का आकार सीखें', 'क्या खरीदें के साथ कितना खरीदें भी जरूरी है। नुकसान बजट, स्टॉप और खर्च तय करें। जोखिम औजार से गणना देखें.'],
      ['रणनीतियाँ तुलना करें', 'एक बाजार में अलग रणनीतियाँ अलग नतीजे देती हैं। समूह, बैकटेस्ट और मॉडल लैब में उनकी सीमाएँ सीखें.'],
      ['अपनी भाषा में सीखें', 'हिन्दी, తెలుగు और English में पाठ और ज्ञान जाँच हैं। सरल मोड में बड़े बटन और कड़ी जोखिम सीमा है.'],
    ],
  }
  const labels = language === 'te' ? ['దాటవేయండి','తదుపరి','పాఠాలు ప్రారంభించండి','స్వయంగా చూడండి','అసలు ట్రేడింగ్ ఈ వెర్షన్‌లో లేదు.'] : language === 'hi' ? ['छोड़ें','अगला','पाठ शुरू करें','खुद देखें','इस संस्करण में असली ट्रेडिंग नहीं है.'] : ['Skip','Next','Start learning','Explore on my own','Real trading is locked in this version.']
  const step = STEPS[i]
  const text = language === 'en' ? [step.title, step.body] : translations[language][i]
  const last = i === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md m-4 card !p-6 space-y-5">
        <select aria-label="Learning language" className="input" value={language} onChange={e => useStore.getState().setLanguage(e.target.value as Language)}>{Object.entries(LANGUAGES).map(([id,name]) => <option key={id} value={id}>{name}</option>)}</select>
        <div className="flex justify-center">
          <div className="rounded-2xl bg-accent/10 border border-accent/30 p-4">
            <step.Icon size={30} className="text-accent" strokeWidth={1.6} />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-xl font-extrabold">{text[0]}</h2>
          <p className="text-sm text-muted leading-relaxed">{text[1]}</p>
        </div>

        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, j) => (
            <div key={j} className={`h-1.5 rounded-full transition-all ${j === i ? 'w-6 bg-accent' : 'w-1.5 bg-edge'}`} />
          ))}
        </div>

        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onDone}>
            {last ? labels[3] : labels[0]}
          </button>
          <button
            className="btn-primary flex-1 flex items-center justify-center gap-2"
            onClick={() => {
              if (!last) return setI(i + 1)
              onDone()
              navigate('/learn')
            }}
          >
            {last ? labels[2] : labels[1]}
            <ArrowRight size={16} />
          </button>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
          <Lock size={11} /> {labels[4]}
        </p>
      </div>
    </div>
  )
}
