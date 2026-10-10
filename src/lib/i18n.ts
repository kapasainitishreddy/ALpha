import { useStore } from '@/store/useStore'
export type Language = 'en' | 'te' | 'hi'
export const LANGUAGES: Record<Language, string> = { en: 'English', te: 'తెలుగు', hi: 'हिन्दी' }
// Technical terms remain visible alongside translations, so learners can use exchange documentation.
const words: Record<string, [string, string, string]> = {
  home: ['Home', 'హోమ్', 'होम'],
  father: ['Father', 'నాన్న మోడ్', 'सरल मोड'],
  trade: ['Trade', 'ట్రేడ్', 'ट्रेड'],
  swarm: ['Swarm', 'వ్యూహాల బృందం', 'रणनीति समूह'],
  more: ['More', 'మరిన్ని', 'और'],
  learn: ['Learn trading', 'ట్రేడింగ్ నేర్చుకోండి', 'ट्रेडिंग सीखें'],
  research: ['Research desk', 'పరిశోధన కేంద్రం', 'शोध केंद्र'],
  models: ['Model experiments', 'మోడల్ ప్రయోగాలు', 'मॉडल प्रयोग'],
  portfolio: ['Paper portfolio', 'వర్చువల్ పోర్ట్‌ఫోలియో', 'वर्चुअल पोर्टफोलियो'],
  replay: ['Historical replay', 'చారిత్రక రీప్లే', 'ऐतिहासिक रीप्ले'],
  paperNotice: [
    'Practice uses virtual money. Profits cannot be withdrawn.',
    'అభ్యాసం వర్చువల్ డబ్బుతో జరుగుతుంది. లాభాలను తీసుకోలేరు.',
    'अभ्यास वर्चुअल पैसे से होता है। मुनाफा निकाला नहीं जा सकता।',
  ],
  snapshotNotice: [
    'Quotes may be delayed. Polling cannot reproduce tick fills, liquidity or queue priority.',
    'కోట్స్ ఆలస్యం కావచ్చు. ప్రతి టిక్, లిక్విడిటీ లేదా ఆర్డర్ క్యూ ఇక్కడ పునరుత్పత్తి కావు.',
    'भाव में देरी हो सकती है। हर टिक, लिक्विडिटी और ऑर्डर कतार का अनुकरण नहीं होता।',
  ],
  simulationCosts: [
    'Model: 0.03% fee per side and 0.05% adverse market slippage. Taxes and actual broker charges differ. Shorts reserve full notional; no leverage.',
    'మోడల్: ప్రతి వైపు 0.03% ఫీజు, మార్కెట్ ఫిల్‌లో 0.05% స్లిపేజ్. అసలు పన్నులు, ఛార్జీలు వేరు. షార్ట్‌కు పూర్తి విలువ నిల్వ; లీవరేజ్ లేదు.',
    'मॉडल: प्रत्येक तरफ 0.03% शुल्क और 0.05% प्रतिकूल स्लिपेज। वास्तविक कर और शुल्क अलग हैं। शॉर्ट में पूरा मूल्य आरक्षित है; लीवरेज नहीं।',
  ],
  livePractice: ['Market quote practice', 'మార్కెట్ ధరలతో అభ్యాసం', 'बाजार भाव पर अभ्यास'],
  instrument: ['Instrument', 'ఆస్తి (Instrument)', 'साधन (Instrument)'],
  orderType: ['Order type', 'ఆర్డర్ రకం', 'ऑर्डर प्रकार'],
  paperOrder: ['Place paper order', 'వర్చువల్ ఆర్డర్ ఇవ్వండి', 'वर्चुअल ऑर्डर दें'],
  quantity: ['Quantity', 'పరిమాణం', 'मात्रा'],
  orderPrice: ['Limit / trigger price', 'లిమిట్ / ట్రిగ్గర్ ధర', 'लिमिट / ट्रिगर भाव'],
  stopLoss: ['Stop loss %', 'స్టాప్ లాస్ %', 'स्टॉप लॉस %'],
  target: ['Target %', 'లక్ష్యం %', 'लक्ष्य %'],
  buy: ['Buy', 'కొనండి', 'खरीदें'],
  sell: ['Sell / short', 'అమ్మండి / షార్ట్', 'बेचें / शॉर्ट'],
  market: ['Market', 'మార్కెట్', 'मार्केट'],
  limit: ['Limit', 'లిమిట్', 'लिमिट'],
  stop: ['Stop entry', 'స్టాప్ ఎంట్రీ', 'स्टॉप एंट्री'],
  availableCapital: [
    'Available paper capital',
    'అందుబాటులో వర్చువల్ మూలధనం',
    'उपलब्ध वर्चुअल पूंजी',
  ],
  quoteTime: ['Source quote time', 'మూల ధర సమయం', 'स्रोत भाव समय'],
  unknownQuoteTime: ['Quote time unknown', 'ధర సమయం తెలియదు', 'भाव समय अज्ञात'],
  delayedQuote: [
    'Potentially delayed snapshot',
    'ఆలస్యమయ్యే ధర స్నాప్‌షాట్',
    'संभावित विलंबित भाव',
  ],
  marketClosed: [
    'Market closed; orders disabled (holiday calendar not included)',
    'మార్కెట్ మూసివేయబడింది; ఆర్డర్లు నిలిపివేయబడ్డాయి (సెలవుల క్యాలెండర్ లేదు)',
    'बाजार बंद; ऑर्डर बंद (अवकाश कैलेंडर शामिल नहीं)',
  ],
  staleQuote: [
    'Quote stale or unavailable. Refresh before trading.',
    'ధర పాతది లేదా అందుబాటులో లేదు. ట్రేడ్ ముందు రిఫ్రెష్ చేయండి.',
    'भाव पुराना या अनुपलब्ध है। ट्रेड से पहले रिफ्रेश करें।',
  ],
  feedError: [
    'Market feed unavailable. Use mock or CSV replay practice.',
    'మార్కెట్ ఫీడ్ అందుబాటులో లేదు. మాక్ లేదా CSV రీప్లే వాడండి.',
    'बाजार फीड अनुपलब्ध है। मॉक या CSV रीप्ले का उपयोग करें।',
  ],
  loading: ['Loading…', 'లోడ్ అవుతోంది…', 'लोड हो रहा है…'],
  refresh: ['Refresh', 'రిఫ్రెష్', 'रिफ्रेश'],
  openPositions: ['Open positions', 'ఓపెన్ పొజిషన్లు', 'खुली पोजिशन'],
  closedTrades: ['Closed trades', 'ముగిసిన ట్రేడ్లు', 'बंद ट्रेड'],
  saveJournal: ['Save to journal', 'జర్నల్‌లో సేవ్ చేయండి', 'जर्नल में सहेजें'],
  next: ['Next candle', 'తదుపరి క్యాండిల్', 'अगली कैंडल'],
  practice: ['Practice this concept', 'ఈ భావనను అభ్యసించండి', 'इस अवधारणा का अभ्यास करें'],
  check: ['Check answer', 'సమాధానం తనిఖీ', 'उत्तर जाँचें'],
  correct: ['Correct — lesson completed.', 'సరైనది — పాఠం పూర్తయింది.', 'सही — पाठ पूरा हुआ।'],
  retry: [
    'Review the explanation and try again.',
    'వివరణ చదివి మళ్లీ ప్రయత్నించండి.',
    'व्याख्या पढ़ें और फिर प्रयास करें।',
  ],
  quiz: ['Knowledge check', 'జ్ఞాన పరీక్ష', 'ज्ञान जाँच'],
  sources: ['Sources / further reading', 'మూలాలు / మరింత చదవండి', 'स्रोत / आगे पढ़ें'],
  'Open P/L': ['Open P/L', 'ఓపెన్ లాభనష్టం', 'खुला लाभ नुकसान'],
  'Closed P/L': ['Closed P/L', 'ముగిసిన లాభనష్టం', 'बंद लाभ नुकसान'],
  Positions: ['Positions', 'పొజిషన్లు', 'पोजिशन'],
  'Place mock order': ['Place mock order', 'వర్చువల్ ఆర్డర్ ఇవ్వండి', 'वर्चुअल ऑर्डर दें'],
  'Open positions': ['Open positions', 'ఓపెన్ పొజిషన్లు', 'खुली पोजिशन'],
  'Closed this session': [
    'Closed this session',
    'ఈ సెషన్‌లో ముగిసిన ట్రేడ్లు',
    'इस सत्र में बंद ट्रेड',
  ],
  'Order type': ['Order type', 'ఆర్డర్ రకం', 'ऑर्डर प्रकार'],
  Quantity: ['Quantity', 'పరిమాణం', 'मात्रा'],
  'Stop loss %': ['Stop loss %', 'స్టాప్ లాస్ %', 'स्टॉप लॉस %'],
  'Target %': ['Target %', 'లక్ష్యం %', 'लक्ष्य %'],
  'Strategy tag (optional)': [
    'Strategy tag (optional)',
    'వ్యూహం ట్యాగ్ (ఐచ్ఛికం)',
    'रणनीति टैग (वैकल्पिक)',
  ],
  'Underlying spot': ['Underlying spot', 'ఆధార ఆస్తి ధర', 'मूल साधन का भाव'],
  'Lab cash equity': ['Lab cash equity', 'ల్యాబ్ నగదు ఈక్విటీ', 'लैब नकद इक्विटी'],
  'Mark to market': ['Mark to market', 'ప్రస్తుత ధర లాభనష్టం', 'वर्तमान भाव का लाभ नुकसान'],
  'Available collateral': ['Available collateral', 'అందుబాటులో భద్రతా మొత్తం', 'उपलब्ध जमानत'],
  'Contract settings': ['Contract settings', 'కాంట్రాక్ట్ సెట్టింగులు', 'कॉन्ट्रैक्ट सेटिंग'],
  Product: ['Product', 'ఉత్పత్తి', 'उत्पाद'],
  'Units (illustrative multiplier)': [
    'Units (illustrative multiplier)',
    'యూనిట్లు (ఉదాహరణ పరిమాణం)',
    'इकाई (उदाहरण गुणक)',
  ],
  'Days to expiry': ['Days to expiry', 'గడువు వరకు రోజులు', 'समाप्ति तक दिन'],
  Structure: ['Structure', 'నిర్మాణం', 'संरचना'],
  'Flat IV %': ['Flat IV %', 'స్థిర IV %', 'स्थिर IV %'],
  'Preview: expiry P/L and Greeks': [
    'Preview: expiry P/L and Greeks',
    'ప్రివ్యూ: గడువు లాభనష్టం మరియు గ్రీక్స్',
    'पूर्वावलोकन: समाप्ति लाभ नुकसान और ग्रीक्स',
  ],
  'Futures & options practice': [
    'Futures & options practice',
    'ఫ్యూచర్స్ మరియు ఆప్షన్స్ అభ్యాసం',
    'फ्यूचर्स और ऑप्शन अभ्यास',
  ],
  language: ['Learning language', 'నేర్చుకునే భాష', 'सीखने की भाषा'],
  export: ['Export backup', 'బ్యాకప్ ఎగుమతి', 'बैकअप निर्यात'],
  import: ['Restore backup', 'బ్యాకప్ పునరుద్ధరణ', 'बैकअप बहाल करें'],
  balance: ['Paper balance', 'వర్చువల్ బ్యాలెన్స్', 'वर्चुअल बैलेंस'],
  today: ['Today', 'ఈ రోజు', 'आज'],
}
export function translate(key: string, language: Language): string {
  const entry = words[key] ?? Object.values(words).find((value) => value[0] === key)
  return entry?.[language === 'te' ? 1 : language === 'hi' ? 2 : 0] ?? key
}
export function useTranslation() {
  const language = useStore((s) => s.language)
  return { language, t: (key: string) => translate(key, language) }
}
export function localized<T>(value: Record<Language, T>, language: Language): T {
  return value[language]
}
