import type { Language } from '@/lib/i18n'
export interface Lesson { id: string; title: Record<Language,string>; body: Record<Language,string>; question: Record<Language,string>; answers: Record<Language,string[]>; correct: number; route: string; source: string; relatedSources?: { label: string; url: string }[] }
export const CURRICULUM: Lesson[] = [
  {
    "id": "ownership",
    "title": {
      "en": "Shares and ownership",
      "te": "షేర్లు మరియు యాజమాన్యం",
      "hi": "शेयर और स्वामित्व"
    },
    "body": {
      "en": "A share is an ownership interest in a company. Issued shares are those the company has issued; outstanding shares are currently held by investors (after subtracting treasury shares). Ownership percentage uses the relevant class’s outstanding shares. A rising price is not proof of a sound business, and dividends are not guaranteed.",
      "te": "షేర్ అంటే కంపెనీలో యాజమాన్య భాగం. జారీ చేసిన షేర్లు కంపెనీ విడుదల చేసినవి; బకాయి షేర్లు ట్రెజరీలో ఉన్నవాటిని తీసివేసి ప్రస్తుతం పెట్టుబడిదారుల వద్ద ఉన్నవి. యాజమాన్య శాతం సంబంధిత తరగతి బకాయి షేర్లతో లెక్కించాలి. పెరుగుతున్న ధర మంచి వ్యాపారానికి సాక్ష్యం కాదు; డివిడెండ్ ఖాయం కాదు.",
      "hi": "शेयर कंपनी में हिस्सेदारी है। जारी शेयर वे हैं जिन्हें कंपनी ने जारी किया; बकाया शेयर वे हैं जो ट्रेजरी शेयर घटाने के बाद निवेशकों के पास हैं। स्वामित्व प्रतिशत संबंधित वर्ग के बकाया शेयरों से निकालें। बढ़ता भाव अच्छे कारोबार का प्रमाण नहीं और लाभांश निश्चित नहीं।"
    },
    "question": {
      "en": "What does a share represent?",
      "te": "షేర్ ఏమి సూచిస్తుంది?",
      "hi": "शेयर क्या दर्शाता है?"
    },
    "answers": {
      "en": [
        "Ownership in a company",
        "A guaranteed payment",
        "A riskless deposit"
      ],
      "te": [
        "కంపెనీలో యాజమాన్యం",
        "ఖచ్చిత చెల్లింపు",
        "ప్రమాదం లేని డిపాజిట్"
      ],
      "hi": [
        "कंपनी में हिस्सेदारी",
        "निश्चित भुगतान",
        "जोखिम रहित जमा"
      ]
    },
    "correct": 0,
    "route": "/manual",
    "source": "https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks",
    "relatedSources": [{"label":"SEC — Issued and Outstanding Shares","url":"https://www.sec.gov/resources-small-businesses/glossary"}]
  },
  {
    "id": "orders",
    "title": {
      "en": "Market, limit and stop orders",
      "te": "మార్కెట్, లిమిట్ మరియు స్టాప్ ఆర్డర్లు",
      "hi": "मार्केट, लिमिट और स्टॉप ऑर्डर"
    },
    "body": {
      "en": "A market order prioritizes execution, not price. A buy limit can fill at or below its limit, but may never fill. A buy stop activates when price reaches or exceeds its trigger. A gap can cause a stop fill away from its trigger; this bar model is not an executable quote.",
      "te": "మార్కెట్ ఆర్డర్‌లో ధర కన్నా అమలు ముఖ్యం. బై లిమిట్ నిర్ణయించిన ధర లేదా తక్కువ ధరలో నిండవచ్చు; అసలు నిండకపోవచ్చు. ధర ట్రిగ్గర్‌ను చేరినప్పుడు లేదా దాటినప్పుడు బై స్టాప్ చలిస్తుంది. గ్యాప్‌లో ట్రిగ్గర్ ధరకు భిన్నంగా అమలు కావచ్చు; ఈ క్యాండిల్ నమూనా అమలయ్యే కోట్ కాదు.",
      "hi": "मार्केट ऑर्डर में निष्पादन को प्राथमिकता है, भाव को नहीं। बाय लिमिट तय भाव या नीचे भर सकती है, पर भरना निश्चित नहीं। भाव ट्रिगर तक पहुँचने या उससे ऊपर जाने पर बाय स्टॉप सक्रिय होती है। गैप में भराव ट्रिगर से अलग भाव पर हो सकता है; यह बार मॉडल निष्पादन योग्य कोट नहीं है."
    },
    "question": {
      "en": "Can a limit order remain unfilled?",
      "te": "లిమిట్ ఆర్డర్ నిండకుండా ఉండవచ్చా?",
      "hi": "क्या लिमिट ऑर्डर अधूरी रह सकती है?"
    },
    "answers": {
      "en": [
        "Yes",
        "No",
        "Only when profitable"
      ],
      "te": [
        "అవును",
        "కాదు",
        "లాభం ఉన్నప్పుడే"
      ],
      "hi": [
        "हाँ",
        "नहीं",
        "केवल मुनाफे में"
      ]
    },
    "correct": 0,
    "route": "/manual",
    "source": "https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/types-orders"
  },
  {
    "id": "risk",
    "title": {
      "en": "Position sizing and stop risk",
      "te": "పొజిషన్ పరిమాణం మరియు రిస్క్",
      "hi": "पोजिशन आकार और जोखिम"
    },
    "body": {
      "en": "Choose a loss budget before a quantity: quantity = risk budget / distance from entry to stop. Also cap notional exposure and reserve cash for costs. A stop is a plan, not a guarantee; gaps increase losses.",
      "te": "పరిమాణం ముందు నష్టం బడ్జెట్ నిర్ణయించండి: పరిమాణం = రిస్క్ బడ్జెట్ / ఎంట్రీ నుంచి స్టాప్ దూరం. మొత్తం విలువకు పరిమితి పెట్టి ఖర్చులకు నగదు ఉంచండి. స్టాప్ నష్టం పరిమితం చేసే ప్రణాళిక మాత్రమే; గ్యాప్‌లలో నష్టం పెరుగుతుంది.",
      "hi": "मात्रा से पहले नुकसान बजट तय करें: मात्रा = जोखिम बजट / एंट्री से स्टॉप की दूरी। कुल मूल्य सीमित रखें और खर्च के लिए नकदी रखें। स्टॉप योजना है, गारंटी नहीं; गैप से नुकसान बढ़ता है."
    },
    "question": {
      "en": "₹10,000 capital, 1% risk, ₹10 stop distance: maximum before costs?",
      "te": "₹10,000 మూలధనం, 1% రిస్క్, ₹10 స్టాప్ దూరం: ఖర్చుల ముందు పరిమాణం?",
      "hi": "₹10,000 पूंजी, 1% जोखिम, ₹10 स्टॉप दूरी: खर्च से पहले मात्रा?"
    },
    "answers": {
      "en": [
        "10 shares",
        "100 shares",
        "1,000 shares"
      ],
      "te": [
        "10 షేర్లు",
        "100 షేర్లు",
        "1,000 షేర్లు"
      ],
      "hi": [
        "10 शेयर",
        "100 शेयर",
        "1,000 शेयर"
      ]
    },
    "correct": 0,
    "route": "/risk",
    "source": "https://www.cmegroup.com/education/courses/trade-and-risk-management.html"
  },
  {
    "id": "expectancy",
    "title": {
      "en": "Win rate, expectancy and costs",
      "te": "విన్ రేట్, అంచనా విలువ మరియు ఖర్చులు",
      "hi": "जीत दर, अपेक्षित मूल्य और खर्च"
    },
    "body": {
      "en": "Expected result = win probability × average win − loss probability × average loss − costs. A 70% win rate can lose money when losses are much larger than wins. A small sample is unreliable.",
      "te": "అంచనా ఫలితం = గెలుపు సంభావ్యత × సగటు లాభం − నష్టం సంభావ్యత × సగటు నష్టం − ఖర్చులు. 70% ట్రేడ్లు గెలిచినా నష్టాలు పెద్దగా ఉంటే మొత్తం నష్టం వస్తుంది. చిన్న నమూనా నమ్మదగినది కాదు.",
      "hi": "अपेक्षित परिणाम = जीत की संभावना × औसत लाभ − हार की संभावना × औसत नुकसान − खर्च। 70% जीत पर भी बड़े नुकसान कुल घाटा दे सकते हैं। छोटा नमूना भरोसेमंद नहीं."
    },
    "question": {
      "en": "Is win rate alone enough to judge a strategy?",
      "te": "వ్యూహాన్ని అంచనా వేయడానికి విన్ రేట్ ఒక్కటే సరిపోతుందా?",
      "hi": "क्या केवल जीत दर रणनीति के लिए पर्याप्त है?"
    },
    "answers": {
      "en": [
        "No: size of wins, losses and costs matter",
        "Yes",
        "Only the best trade matters"
      ],
      "te": [
        "కాదు: లాభాలు, నష్టాలు, ఖర్చులు ముఖ్యం",
        "అవును",
        "మంచి ట్రేడ్ మాత్రమే ముఖ్యం"
      ],
      "hi": [
        "नहीं: लाभ, नुकसान और खर्च भी जरूरी",
        "हाँ",
        "केवल सबसे अच्छा ट्रेड जरूरी"
      ]
    },
    "correct": 0,
    "route": "/insights",
    "source": "https://www.cmegroup.com/education/courses/trade-and-risk-management.html"
  },
  {
    "id": "candles",
    "title": {
      "en": "Candles, volume and market structure",
      "te": "క్యాండిల్స్, వాల్యూమ్ మరియు మార్కెట్ నిర్మాణం",
      "hi": "कैंडल, वॉल्यूम और बाजार संरचना"
    },
    "body": {
      "en": "OHLC gives open, high, low and close, not the order of intrabar moves. Volume counts activity, not whether institutions will buy tomorrow. Support and resistance are zones that can fail.",
      "te": "OHLC అంటే ఓపెన్, హై, లో, క్లోజ్; మధ్యలో ఏ ధర ముందుగా వచ్చిందో చెప్పదు. వాల్యూమ్ కార్యకలాపం చూపుతుంది; రేపు సంస్థలు కొంటాయని చెప్పదు. సపోర్ట్, రెసిస్టెన్స్ విఫలం కావచ్చు.",
      "hi": "OHLC खुला, उच्च, निम्न और बंद भाव देता है; बीच के भावों का क्रम नहीं। वॉल्यूम गतिविधि दिखाता है, कल संस्थागत खरीद नहीं बताता। सपोर्ट और रेजिस्टेंस टूट सकते हैं."
    },
    "question": {
      "en": "Can OHLC reveal which exit touched first?",
      "te": "OHLC ద్వారా ఏ ఎగ్జిట్ ముందుగా తాకిందో తెలుస్తుందా?",
      "hi": "क्या OHLC से पता चलता है कौन सा एग्जिट पहले छुआ?"
    },
    "answers": {
      "en": [
        "No",
        "Always",
        "Volume alone tells it"
      ],
      "te": [
        "కాదు",
        "ఎల్లప్పుడూ",
        "వాల్యూమ్ చెబుతుంది"
      ],
      "hi": [
        "नहीं",
        "हमेशा",
        "वॉल्यूम बता देता है"
      ]
    },
    "correct": 0,
    "route": "/replay?lesson=candles",
    "source": "https://zerodha.com/varsity/module/technical-analysis/"
  },
  {
    "id": "trend",
    "title": {
      "en": "Trend, EMA and moving averages",
      "te": "ట్రెండ్, EMA మరియు మూవింగ్ యావరేజ్లు",
      "hi": "ट्रेंड, EMA और मूविंग एवरेज"
    },
    "body": {
      "en": "EMA weights recent prices more. A crossover or price above a rising average is a rule, not proof of an edge. Trend rules can repeatedly lose in sideways markets. Test several market regimes; this is not evidence of an edge.",
      "te": "EMA ఇటీవలి ధరలకు ఎక్కువ బరువు ఇస్తుంది. క్రాస్ఓవర్ లేదా పెరుగుతున్న సగటుపైన ధర ఒక నియమం; లాభానికి సాక్ష్యం కాదు. పక్కదారి మార్కెట్‌లో ట్రెండ్ నియమాలు వరుస నష్టాలు ఇవ్వవచ్చు. విభిన్న మార్కెట్ పరిస్థితుల్లో పరీక్షించండి; ఇది లాభదాయకతకు సాక్ష్యం కాదు.",
      "hi": "EMA हाल के भावों को अधिक वजन देती है। क्रॉसओवर या बढ़ते औसत के ऊपर भाव एक नियम है, लाभ का प्रमाण नहीं। रेंज वाले बाजार में ट्रेंड नियम बार-बार नुकसान दे सकते हैं। अलग-अलग बाजार परिस्थितियों में जाँचें; यह बढ़त का प्रमाण नहीं है।"
    },
    "question": {
      "en": "Where can trend rules struggle?",
      "te": "ట్రెండ్ నియమాలు ఎక్కడ ఇబ్బంది పడవచ్చు?",
      "hi": "ट्रेंड नियम कहाँ कमजोर हो सकते हैं?"
    },
    "answers": {
      "en": [
        "Sideways markets",
        "Only upward markets",
        "They never struggle"
      ],
      "te": [
        "పక్కదారి మార్కెట్",
        "పెరుగుతున్న మార్కెట్ మాత్రమే",
        "ఎప్పుడూ కాదు"
      ],
      "hi": [
        "साइडवेज बाजार",
        "केवल बढ़ते बाजार",
        "कभी नहीं"
      ]
    },
    "correct": 0,
    "route": "/backtest",
    "source": "https://zerodha.com/varsity/module/technical-analysis/"
  },
  {
    "id": "rsi",
    "title": {
      "en": "RSI and mean reversion",
      "te": "RSI మరియు మీన్ రివర్షన్",
      "hi": "RSI और मीन रिवर्जन"
    },
    "body": {
      "en": "RSI compares recent gains and losses on a 0–100 scale. Oversold does not mean price must rise: strong trends can stay oversold. Mean reversion assumes deviations will shrink; structural change can break it.",
      "te": "RSI ఇటీవలి లాభాలు, నష్టాలను 0–100 స్థాయిలో పోలుస్తుంది. ఓవర్‌సోల్డ్ అంటే ధర తప్పక పెరుగుతుందని కాదు. బలమైన ట్రెండ్‌లో అలాగే ఉండవచ్చు. మీన్ రివర్షన్‌లో వ్యత్యాసం తగ్గుతుందని భావిస్తారు; నిర్మాణ మార్పు దాన్ని చెడగొడుతుంది.",
      "hi": "RSI हाल के लाभ और नुकसान को 0–100 पैमाने पर तुलना करता है। ओवरसोल्ड का मतलब भाव जरूर बढ़ेगा नहीं। मजबूत ट्रेंड में ऐसा बना रह सकता है। मीन रिवर्जन में अंतर घटने की धारणा है; संरचनात्मक बदलाव इसे तोड़ सकते हैं."
    },
    "question": {
      "en": "Does RSI below 30 guarantee a bounce?",
      "te": "RSI 30 కంటే తక్కువైతే బౌన్స్ ఖాయమా?",
      "hi": "क्या RSI 30 से नीचे होने पर उछाल निश्चित है?"
    },
    "answers": {
      "en": [
        "No",
        "Yes",
        "Only for expensive shares"
      ],
      "te": [
        "కాదు",
        "అవును",
        "ఖరీదైన షేర్లకే"
      ],
      "hi": [
        "नहीं",
        "हाँ",
        "केवल महंगे शेयरों में"
      ]
    },
    "correct": 0,
    "route": "/builder",
    "source": "https://zerodha.com/varsity/module/technical-analysis/"
  },
  {
    "id": "breakouts",
    "title": {
      "en": "Breakouts, VWAP and false signals",
      "te": "బ్రేకౌట్లు, VWAP మరియు తప్పుడు సిగ్నల్స్",
      "hi": "ब्रेकआउट, VWAP और झूठे संकेत"
    },
    "body": {
      "en": "Compare a breakout with the prior window, excluding the current bar. Volume may confirm participation but fakeouts occur. VWAP is a volume weighted reference; its session start matters.",
      "te": "బ్రేకౌట్‌ను ప్రస్తుత క్యాండిల్ మినహాయించిన గత ధరలతో పోల్చండి. వాల్యూమ్ పాల్గొనేవారిని చూపవచ్చు; నకిలీ బ్రేకౌట్లు ఉంటాయి. VWAP వాల్యూమ్ ఆధారిత సగటు; సెషన్ ప్రారంభ సమయం ముఖ్యం.",
      "hi": "ब्रेकआउट की तुलना वर्तमान कैंडल को हटाकर पिछले भावों से करें। वॉल्यूम भागीदारी दिखा सकता है; फेकआउट भी होते हैं। VWAP वॉल्यूम भारित भाव है; सत्र की शुरुआत जरूरी है."
    },
    "question": {
      "en": "Should the current candle set its own breakout threshold?",
      "te": "ప్రస్తుత క్యాండిల్ తన బ్రేకౌట్ స్థాయిని తానే నిర్ణయించాలా?",
      "hi": "क्या वर्तमान कैंडल अपनी ब्रेकआउट सीमा तय करे?"
    },
    "answers": {
      "en": [
        "No, use prior bars",
        "Yes",
        "Use tomorrow’s bar"
      ],
      "te": [
        "కాదు, గత క్యాండిల్స్ వాడండి",
        "అవును",
        "రేపటి క్యాండిల్ వాడండి"
      ],
      "hi": [
        "नहीं, पिछली कैंडल लें",
        "हाँ",
        "कल की कैंडल लें"
      ]
    },
    "correct": 0,
    "route": "/builder",
    "source": "https://zerodha.com/varsity/module/technical-analysis/"
  },
  {
    "id": "fundamentals",
    "title": {
      "en": "Fundamentals and valuation",
      "te": "ఫండమెంటల్స్ మరియు విలువ",
      "hi": "फंडामेंटल और मूल्यांकन"
    },
    "body": {
      "en": "Compare earnings quality, cash flow, leverage, dilution and valuation against peers. A low P/E can reflect a weak business or cyclical peak earnings. Read exchange filings before relying on screeners.",
      "te": "లాభాల నాణ్యత, నగదు ప్రవాహం, అప్పు, షేర్ డైల్యూషన్, విలువను సమాన కంపెనీలతో పోల్చండి. తక్కువ P/E బలహీన వ్యాపారం లేదా చక్రంలో గరిష్ఠ లాభాల వల్ల కావచ్చు. స్క్రీనర్ ముందు ఎక్స్చేంజ్ నివేదికలు చదవండి.",
      "hi": "कमाई की गुणवत्ता, नकदी प्रवाह, कर्ज, शेयर बढ़ोतरी और मूल्यांकन साथियों से तुलना करें। कम P/E कमजोर कारोबार या चक्रीय ऊँची कमाई दिखा सकता है। स्क्रीनर से पहले एक्सचेंज रिपोर्ट पढ़ें."
    },
    "question": {
      "en": "Is low P/E alone a buy signal?",
      "te": "తక్కువ P/E ఒక్కటే కొనుగోలు సంకేతమా?",
      "hi": "क्या कम P/E अकेले खरीद संकेत है?"
    },
    "answers": {
      "en": [
        "No",
        "Yes",
        "Only if the price rose today"
      ],
      "te": [
        "కాదు",
        "అవును",
        "ఈ రోజు పెరిగితేనే"
      ],
      "hi": [
        "नहीं",
        "हाँ",
        "केवल आज भाव बढ़ा हो"
      ]
    },
    "correct": 0,
    "route": "/research",
    "source": "https://www.nseindia.com/companies-listing/corporate-filings-announcements"
  },
  {
    "id": "portfolio",
    "title": {
      "en": "Diversification and allocation",
      "te": "విభజన మరియు కేటాయింపు",
      "hi": "विविधीकरण और आवंटन"
    },
    "body": {
      "en": "Holdings in the same sector can be highly correlated. Diversify economic exposures, not just ticker counts. Inverse volatility allocation is a simple risk model; correlations can surge in crises and rebalancing costs matter.",
      "te": "ఒకే రంగంలోని షేర్లు కలిసి కదలవచ్చు. టిక్కర్ సంఖ్య మాత్రమే కాదు, ఆర్థిక ప్రభావాలను విభజించండి. ఇన్వర్స్ వోలాటిలిటీ సాధారణ రిస్క్ మోడల్. సంక్షోభంలో సంబంధాలు పెరుగుతాయి; రీబ్యాలెన్స్ ఖర్చు ముఖ్యం.",
      "hi": "एक क्षेत्र के शेयर साथ चल सकते हैं। केवल टिकर संख्या नहीं, आर्थिक जोखिम विविध करें। इन्वर्स वोलैटिलिटी सरल जोखिम मॉडल है। संकट में सहसंबंध बढ़ते हैं; रीबैलेंस खर्च जरूरी है."
    },
    "question": {
      "en": "Can many bank stocks still share one major risk?",
      "te": "అనేక బ్యాంక్ షేర్లకు ఒకే ప్రధాన రిస్క్ ఉండవచ్చా?",
      "hi": "क्या कई बैंक शेयर एक बड़ा साझा जोखिम रख सकते हैं?"
    },
    "answers": {
      "en": [
        "Yes",
        "No",
        "Only on weekends"
      ],
      "te": [
        "అవును",
        "కాదు",
        "వారాంతంలోనే"
      ],
      "hi": [
        "हाँ",
        "नहीं",
        "केवल सप्ताहांत"
      ]
    },
    "correct": 0,
    "route": "/models?kind=allocation",
    "source": "https://www.investor.gov/introduction-investing/getting-started/asset-allocation"
  },
  {
    "id": "shorts",
    "title": {
      "en": "Short selling and leverage",
      "te": "షార్ట్ సెల్లింగ్ మరియు లీవరేజ్",
      "hi": "शॉर्ट सेलिंग और लीवरेज"
    },
    "body": {
      "en": "A short benefits when price falls but can lose more than its initial sale value. Borrow availability, margin, funding and broker square off matter in real markets. This app reserves full notional and provides no real leverage.",
      "te": "షార్ట్ ధర తగ్గితే లాభం పొందుతుంది; కానీ ప్రారంభ అమ్మకం విలువ కంటే ఎక్కువ నష్టం రావచ్చు. అసలు మార్కెట్‌లో షేర్ అప్పు, మార్జిన్, ఫండింగ్, బ్రోకర్ స్క్వేర్ ఆఫ్ ముఖ్యం. ఇక్కడ పూర్తి విలువ రిజర్వ్; అసలు లీవరేజ్ లేదు.",
      "hi": "शॉर्ट को भाव गिरने पर लाभ होता है, पर शुरुआती बिक्री मूल्य से अधिक नुकसान हो सकता है। असली बाजार में उधार, मार्जिन, फंडिंग और ब्रोकर स्क्वायर ऑफ जरूरी हैं। यहाँ पूरा मूल्य आरक्षित है; वास्तविक लीवरेज नहीं."
    },
    "question": {
      "en": "Is the maximum theoretical loss of a naked short bounded?",
      "te": "రక్షణ లేని షార్ట్ గరిష్ఠ సైద్ధాంతిక నష్టం పరిమితమా?",
      "hi": "क्या बिना सुरक्षा शॉर्ट का अधिकतम सैद्धांतिक नुकसान सीमित है?"
    },
    "answers": {
      "en": [
        "No",
        "Yes, at 1%",
        "Yes, at the sale price"
      ],
      "te": [
        "కాదు",
        "అవును 1%",
        "అవును అమ్మిన ధర వద్ద"
      ],
      "hi": [
        "नहीं",
        "हाँ 1% पर",
        "हाँ बिक्री मूल्य पर"
      ]
    },
    "correct": 0,
    "route": "/manual",
    "source": "https://www.sec.gov/investor/pubs/regsho.htm",
    "relatedSources": [{"label":"Investor.gov — Stock Purchases and Sales (Long and Short)","url":"https://www.investor.gov/introduction-investing/investing-basics/how-stock-markets-work/stock-purchases-and-sales-long-and"}]
  },
  {
    "id": "futures",
    "title": {
      "en": "Futures, margin and settlement",
      "te": "ఫ్యూచర్స్, మార్జిన్ మరియు సెటిల్మెంట్",
      "hi": "फ्यूचर्स, मार्जिन और निपटान"
    },
    "body": {
      "en": "Futures P/L = price change × contract multiplier × contracts, with the sign reversed for shorts. Margin is collateral, not the maximum loss. Daily mark to market can require more cash. Expiry and delivery rules are contract specific.",
      "te": "ఫ్యూచర్స్ లాభనష్టం = ధర మార్పు × కాంట్రాక్ట్ మల్టిప్లయర్ × కాంట్రాక్ట్లు; షార్ట్‌కు దిశ తిరుగుతుంది. మార్జిన్ భద్రత మాత్రమే, గరిష్ఠ నష్టం కాదు. రోజువారీ సెటిల్మెంట్‌లో మరింత నగదు అవసరం కావచ్చు. గడువు, డెలివరీ నియమాలు వేరు.",
      "hi": "फ्यूचर्स लाभ नुकसान = भाव बदलाव × कॉन्ट्रैक्ट गुणक × कॉन्ट्रैक्ट संख्या; शॉर्ट का चिन्ह उलटा। मार्जिन जमानत है, अधिकतम नुकसान नहीं। दैनिक निपटान में और नकदी लग सकती है। एक्सपायरी और डिलीवरी नियम अलग हैं."
    },
    "question": {
      "en": "Is futures margin the maximum possible loss?",
      "te": "ఫ్యూచర్స్ మార్జిన్ గరిష్ఠ నష్టమా?",
      "hi": "क्या फ्यूचर्स मार्जिन अधिकतम नुकसान है?"
    },
    "answers": {
      "en": [
        "No",
        "Yes",
        "Only for short contracts"
      ],
      "te": [
        "కాదు",
        "అవును",
        "షార్ట్ కాంట్రాక్ట్లకే"
      ],
      "hi": [
        "नहीं",
        "हाँ",
        "केवल शॉर्ट कॉन्ट्रैक्ट में"
      ]
    },
    "correct": 0,
    "route": "/derivatives",
    "source": "https://www.nseindia.com/static/products-services/equity-derivatives-contract-specifications"
  },
  {
    "id": "options",
    "title": {
      "en": "Options and the Greeks",
      "te": "ఆప్షన్స్ మరియు గ్రీక్స్",
      "hi": "ऑप्शन और ग्रीक्स"
    },
    "body": {
      "en": "A long option can expire worthless. Delta measures price sensitivity, gamma the change in delta, theta time sensitivity, and vega volatility sensitivity. Being right on direction is insufficient if the premium, timing or volatility changes work against you.",
      "te": "కొన్న ఆప్షన్ గడువు ముగిసేటప్పుడు విలువ లేకుండా పోవచ్చు. డెల్టా ధర సున్నితత్వం; గామా డెల్టా మార్పు; థీటా సమయం; వేగా వోలాటిలిటీ. దిశ సరిగ్గా అంచనా వేసినా ప్రీమియం, సమయం, వోలాటిలిటీ వ్యతిరేకమైతే నష్టం వస్తుంది.",
      "hi": "खरीदी ऑप्शन शून्य पर समाप्त हो सकती है। डेल्टा भाव संवेदनशीलता, गामा डेल्टा में बदलाव, थीटा समय और वेगा वोलैटिलिटी संवेदनशीलता है। दिशा सही होने पर भी प्रीमियम, समय या वोलैटिलिटी से नुकसान हो सकता है."
    },
    "question": {
      "en": "Which Greek measures time decay sensitivity?",
      "te": "సమయం వల్ల విలువ తగ్గే సున్నితత్వం ఏ గ్రీక్?",
      "hi": "समय क्षय संवेदनशीलता किस ग्रीक से मापते हैं?"
    },
    "answers": {
      "en": [
        "Theta",
        "Delta",
        "Vega"
      ],
      "te": [
        "థీటా",
        "డెల్టా",
        "వేగా"
      ],
      "hi": [
        "थीटा",
        "डेल्टा",
        "वेगा"
      ]
    },
    "correct": 0,
    "route": "/options",
    "source": "https://www.optionseducation.org/advancedconcepts/understanding-options-greeks"
  },
  {
    "id": "spreads",
    "title": {
      "en": "Multi-leg options and payoff",
      "te": "బహుళ ఆప్షన్ లెగ్స్ మరియు పేఆఫ్",
      "hi": "बहु लेग ऑप्शन और पेऑफ"
    },
    "body": {
      "en": "A vertical spread uses long and short legs on the same underlying, option type and expiry, at different strikes. A long straddle buys a call and put on the same underlying, strike and expiry. At expiry, the move must be large enough to recover both premiums; before expiry, implied volatility can change resale value. This payoff omits liquidity and exercise/assignment risk; the lab uses a European-style model and does not represent Indian contract rules.",
      "te": "వెర్టికల్ స్ప్రెడ్‌లో ఒకే అండర్లయింగ్, ఆప్షన్ రకం, గడువుపై వేర్వేరు స్ట్రైక్‌ల వద్ద లాంగ్, షార్ట్ లెగ్స్ ఉంటాయి. లాంగ్ స్ట్రాడిల్‌లో ఒకే అండర్లయింగ్, స్ట్రైక్, గడువుతో కాల్, పుట్ కొనుగోలు చేస్తారు. గడువు నాడు రెండు ప్రీమియంలను తిరిగి పొందేందుకు ధర కదలిక పెద్దదై ఉండాలి; గడువుకు ముందు ఇంప్లైడ్ వోలాటిలిటీ పునర్విక్రయ విలువను మార్చవచ్చు. ఈ పే-ఆఫ్‌లో లిక్విడిటీ, ఎక్సర్సైజ్/అసైన్‌మెంట్ రిస్క్ లేవు; ల్యాబ్ యూరోపియన్-శైలి నమూనా, భారత కాంట్రాక్ట్ నియమాలు కాదు.",
      "hi": "वर्टिकल स्प्रेड में एक ही अंडरलाइंग, ऑप्शन प्रकार और समाप्ति पर अलग-अलग स्ट्राइक के लॉन्ग और शॉर्ट लेग होते हैं। लॉन्ग स्ट्रैडल में उसी अंडरलाइंग, स्ट्राइक और समाप्ति की कॉल और पुट खरीदी जाती हैं। समाप्ति पर दोनों प्रीमियम वसूलने के लिए बड़ी चाल चाहिए; उससे पहले इम्प्लाइड वोलैटिलिटी पुनर्विक्रय मूल्य बदल सकती है। पेऑफ में तरलता और एक्सरसाइज/असाइनमेंट जोखिम नहीं हैं; लैब यूरोपीय-शैली मॉडल है, भारतीय अनुबंध नियम नहीं।"
    },
    "question": {
      "en": "Does a long straddle profit from every small move?",
      "te": "లాంగ్ స్ట్రాడిల్ ప్రతి చిన్న కదలికతో లాభం ఇస్తుందా?",
      "hi": "क्या लॉन्ग स्ट्रैडल हर छोटी चाल पर लाभ देता है?"
    },
    "answers": {
      "en": [
        "No, premiums must be recovered",
        "Yes",
        "Only the call premium matters"
      ],
      "te": [
        "కాదు, ప్రీమియంలను కవర్ చేయాలి",
        "అవును",
        "కాల్ ప్రీమియం మాత్రమే ముఖ్యం"
      ],
      "hi": [
        "नहीं, प्रीमियम वसूल होना चाहिए",
        "हाँ",
        "केवल कॉल प्रीमियम जरूरी"
      ]
    },
    "correct": 0,
    "route": "/derivatives",
    "source": "https://www.optionseducation.org/strategies/all-strategies/bull-call-spread-debit-call-spread",
    "relatedSources": [{"label":"OIC — Long Straddle","url":"https://www.optionseducation.org/strategies/all-strategies/long-straddle"}]
  },
  {
    "id": "backtesting",
    "title": {
      "en": "Backtesting without lookahead",
      "te": "ముందుచూపు డేటా లేకుండా బ్యాక్‌టెస్ట్",
      "hi": "भविष्य डेटा बिना बैकटेस्ट"
    },
    "body": {
      "en": "Only use information available at the decision time. Include fees, spread, slippage and terminal exits. Keep a held out period, try several regimes, and never tune on the final evaluation set. Survivorship and corporate actions can bias history.",
      "te": "నిర్ణయ సమయంలో అందుబాటులో ఉన్న సమాచారం మాత్రమే వాడండి. ఫీజు, స్ప్రెడ్, స్లిపేజ్, చివరి ఎగ్జిట్ చేర్చండి. విడిగా పరీక్ష కాలం ఉంచి అనేక పరిస్థితులు చూడండి. చివరి పరీక్ష డేటాపై ట్యూన్ చేయవద్దు. కార్పొరేట్ చర్యలు, ప్రస్తుతం మిగిలిన కంపెనీలకే చరిత్రను పరిమితం చేయడం ఫలితాలను పక్షపాతంగా చూపవచ్చు.",
      "hi": "निर्णय समय पर उपलब्ध सूचना ही लें। शुल्क, स्प्रेड, स्लिपेज और अंतिम एग्जिट जोड़ें। अलग परीक्षण अवधि रखें और कई परिस्थितियाँ देखें। अंतिम परीक्षण डेटा पर ट्यून न करें। बचे हुए शेयर और कॉर्पोरेट बदलाव इतिहास को पक्षपाती कर सकते हैं."
    },
    "question": {
      "en": "Should tomorrow’s close be available to today’s signal?",
      "te": "నేటి సిగ్నల్‌కు రేపటి క్లోజ్ ఇవ్వాలా?",
      "hi": "क्या आज के संकेत को कल का बंद भाव मिलना चाहिए?"
    },
    "answers": {
      "en": [
        "No",
        "Yes",
        "Only in profitable tests"
      ],
      "te": [
        "కాదు",
        "అవును",
        "లాభమున్న పరీక్షలలోనే"
      ],
      "hi": [
        "नहीं",
        "हाँ",
        "केवल लाभकारी परीक्षण में"
      ]
    },
    "correct": 0,
    "route": "/backtest",
    "source": "https://arxiv.org/abs/1408.1159"
  },
  {
    "id": "pairs",
    "title": {
      "en": "Pairs and statistical arbitrage",
      "te": "పెయిర్స్ మరియు స్టాటిస్టికల్ ఆర్బిట్రాజ్",
      "hi": "पेयर और सांख्यिकीय आर्बिट्राज"
    },
    "body": {
      "en": "Pairs trades buy one asset and short another to trade their relative spread. Correlation is not cointegration; a past relationship may break. Hedging ratios, borrow, simultaneous fills and costs matter. Model Lab uses a synthetic paired series.",
      "te": "పెయిర్ ట్రేడ్‌లో ఒక ఆస్తి కొని మరొకటి షార్ట్ చేసి వాటి వ్యత్యాసాన్ని ట్రేడ్ చేస్తారు. సంబంధం కోఇంటిగ్రేషన్ కాదు; గత బంధం చెడిపోవచ్చు. హెడ్జ్ నిష్పత్తి, అప్పు, ఒకేసారి ఫిల్స్, ఖర్చులు ముఖ్యం. మోడల్ ల్యాబ్ సింథటిక్ జంట వాడుతుంది.",
      "hi": "पेयर में एक साधन खरीदकर दूसरे को शॉर्ट करते हैं, सापेक्ष अंतर पर ट्रेड करते हैं। सहसंबंध कोइंटीग्रेशन नहीं है; पुराना संबंध टूट सकता है। हेज अनुपात, उधार, साथ में भरना और खर्च जरूरी हैं। मॉडल लैब कृत्रिम जोड़ी लेता है."
    },
    "question": {
      "en": "Does correlation prove a spread will mean revert?",
      "te": "సంబంధం వ్యత్యాసం తిరిగి వస్తుందని నిరూపిస్తుందా?",
      "hi": "क्या सहसंबंध अंतर वापस आने का प्रमाण है?"
    },
    "answers": {
      "en": [
        "No",
        "Yes",
        "Only with two stocks"
      ],
      "te": [
        "కాదు",
        "అవును",
        "రెండు షేర్లతోనే"
      ],
      "hi": [
        "नहीं",
        "हाँ",
        "केवल दो शेयरों में"
      ]
    },
    "correct": 0,
    "route": "/models?kind=pairs",
    "source": "https://doi.org/10.2307/1913236"
  },
  {
    "id": "microstructure",
    "title": {
      "en": "Grid and market making",
      "te": "గ్రిడ్ మరియు మార్కెట్ మేకింగ్",
      "hi": "ग्रिड और मार्केट मेकिंग"
    },
    "body": {
      "en": "A grid places repeated buy and sell levels. Trending prices can accumulate losing inventory. Market makers quote bid and ask, managing inventory, queue position and adverse selection. A candle simulator cannot demonstrate real queue execution.",
      "te": "గ్రిడ్ పునరావృత కొనుగోలు, అమ్మకం స్థాయులు ఉంచుతుంది. ట్రెండ్‌లో నష్టపోయే ఇన్వెంటరీ పెరుగుతుంది. మార్కెట్ మేకర్లు బిడ్, ఆస్క్ ధరలతో ఇన్వెంటరీ, క్యూ, ప్రతికూల ఎంపికను నిర్వహిస్తారు. క్యాండిల్ సిమ్యులేటర్ అసలు క్యూ అమలు చూపదు.",
      "hi": "ग्रिड बार बार खरीद और बिक्री स्तर रखता है। ट्रेंड में घाटे वाली इन्वेंटरी जमा हो सकती है। मार्केट मेकर बिड और आस्क देकर इन्वेंटरी, कतार और प्रतिकूल चयन संभालता है। कैंडल सिम्युलेटर असली कतार निष्पादन नहीं दिखाता."
    },
    "question": {
      "en": "Can inventory risk offset spread income?",
      "te": "ఇన్వెంటరీ రిస్క్ స్ప్రెడ్ ఆదాయాన్ని మించగలదా?",
      "hi": "क्या इन्वेंटरी जोखिम स्प्रेड कमाई से ज्यादा हो सकता है?"
    },
    "answers": {
      "en": [
        "Yes",
        "No",
        "Only without fees"
      ],
      "te": [
        "అవును",
        "కాదు",
        "ఫీజులు లేకపోతేనే"
      ],
      "hi": [
        "हाँ",
        "नहीं",
        "केवल बिना शुल्क"
      ]
    },
    "correct": 0,
    "route": "/models?kind=grid",
    "source": "https://www.sec.gov/newsroom/speeches-statements/spch092804cag-remarks-council-institutional-investors"
  },
  {
    "id": "arbitrage",
    "title": {
      "en": "Arbitrage and execution risk",
      "te": "ఆర్బిట్రాజ్ మరియు అమలు రిస్క్",
      "hi": "आर्बिट्राज और निष्पादन जोखिम"
    },
    "body": {
      "en": "A visible price difference is not free profit: subtract fees, currency conversion, transfer delays, borrow and failed second-leg execution. Model Lab compares two synthetic venues and charges both legs.",
      "te": "ధర వ్యత్యాసం ఉచిత లాభం కాదు: ఫీజులు, కరెన్సీ మార్పు, బదిలీ ఆలస్యం, అప్పు, రెండో లెగ్ విఫలమయ్యే రిస్క్ తీసివేయండి. మోడల్ ల్యాబ్ రెండు సింథటిక్ మార్కెట్లు, రెండు లెగ్‌ల ఖర్చులు చూపుతుంది.",
      "hi": "दिखता भाव अंतर मुफ्त लाभ नहीं: शुल्क, मुद्रा बदलाव, ट्रांसफर देरी, उधार और दूसरी लेग विफलता घटाएँ। मॉडल लैब दो कृत्रिम बाजार और दोनों लेग का खर्च दिखाता है."
    },
    "question": {
      "en": "Should both legs’ costs be included?",
      "te": "రెండు లెగ్‌ల ఖర్చులు చేర్చాలా?",
      "hi": "क्या दोनों लेग के खर्च शामिल करें?"
    },
    "answers": {
      "en": [
        "Yes",
        "No",
        "Only for losses"
      ],
      "te": [
        "అవును",
        "కాదు",
        "నష్టాలకే"
      ],
      "hi": [
        "हाँ",
        "नहीं",
        "केवल नुकसान पर"
      ]
    },
    "correct": 0,
    "route": "/models?kind=arbitrage",
    "source": "https://hummingbot.org/strategies/"
  },
  {
    "id": "ml",
    "title": {
      "en": "Machine learning and overfitting",
      "te": "మెషీన్ లెర్నింగ్ మరియు ఓవర్‌ఫిట్టింగ్",
      "hi": "मशीन लर्निंग और ओवरफिटिंग"
    },
    "body": {
      "en": "A model learns patterns in its training data, not future truth. Use chronological train/test splits, fit transformations on training data only and compare with simple baselines after costs. Complex models often fit noise.",
      "te": "మోడల్ శిక్షణ డేటాలోని నమూనాలు నేర్చుకుంటుంది; భవిష్యత్తు నిజం కాదు. కాలక్రమంగా ట్రైన్, టెస్ట్ విభజించండి. మార్పులు ట్రైనింగ్‌లోనే నేర్చుకుని ఖర్చుల తరువాత సాధారణ బేస్‌లైన్‌తో పోల్చండి. క్లిష్ట మోడల్స్ శబ్దాన్ని నేర్చుకోవచ్చు.",
      "hi": "मॉडल प्रशिक्षण डेटा के पैटर्न सीखता है, भविष्य का सत्य नहीं। समय क्रम से ट्रेन और टेस्ट बाँटें। बदलाव केवल ट्रेन डेटा पर सीखें और खर्च बाद सरल आधार से तुलना करें। जटिल मॉडल शोर सीख सकते हैं."
    },
    "question": {
      "en": "Which split is safer for time-series evaluation?",
      "te": "కాల శ్రేణి పరీక్షకు ఏ విభజన సురక్షితం?",
      "hi": "समय श्रृंखला परीक्षण में कौन सा विभाजन बेहतर है?"
    },
    "answers": {
      "en": [
        "Chronological holdout",
        "Randomly mix future and past",
        "Test on training data only"
      ],
      "te": [
        "కాలక్రమ హోల్డ్‌అవుట్",
        "గతం భవిష్యత్తు కలపడం",
        "ట్రైన్ డేటాపైనే పరీక్ష"
      ],
      "hi": [
        "समय क्रम का अलग परीक्षण",
        "भविष्य और अतीत मिलाना",
        "केवल ट्रेन डेटा पर परीक्षण"
      ]
    },
    "correct": 0,
    "route": "/models?kind=regression",
    "source": "https://scikit-learn.org/stable/modules/cross_validation.html#time-series-split"
  },
  {
    "id": "rl",
    "title": {
      "en": "Reinforcement learning and policies",
      "te": "రీఇన్‌ఫోర్స్‌మెంట్ లెర్నింగ్ మరియు పాలసీలు",
      "hi": "रीइनफोर्समेंट लर्निंग और नीति"
    },
    "body": {
      "en": "RL learns actions from rewards. If rewards omit costs or the simulator is unrealistic, it can learn a harmful policy. Our small tabular Q-learning experiment trains on the early segment and freezes the policy for the later segment; it is not a production trading model.",
      "te": "RL రివార్డుల ద్వారా చర్యలు నేర్చుకుంటుంది. ఖర్చులు లేకపోతే లేదా సిమ్యులేటర్ అసహజమైతే హానికర పాలసీ నేర్చుకోవచ్చు. ఇక్కడ చిన్న Q-లెర్నింగ్ మొదటి భాగంలో శిక్షణ పొంది చివరి భాగంలో మారకుండా పరీక్షిస్తుంది; అసలు ట్రేడింగ్ మోడల్ కాదు.",
      "hi": "RL पुरस्कार से कार्रवाई सीखता है। खर्च छूटने या अवास्तविक सिम्युलेटर से हानिकारक नीति सीख सकता है। छोटा Q-लर्निंग प्रयोग पहले भाग में ट्रेन होकर बाद के भाग में स्थिर नीति जाँचता है; यह उत्पादन ट्रेडिंग मॉडल नहीं."
    },
    "question": {
      "en": "Can a bad reward definition produce a bad policy?",
      "te": "చెడు రివార్డ్ నిర్వచనం చెడు పాలసీ ఇవ్వగలదా?",
      "hi": "क्या खराब पुरस्कार परिभाषा खराब नीति दे सकती है?"
    },
    "answers": {
      "en": [
        "Yes",
        "No",
        "Only without training"
      ],
      "te": [
        "అవును",
        "కాదు",
        "శిక్షణ లేకపోతేనే"
      ],
      "hi": [
        "हाँ",
        "नहीं",
        "केवल बिना प्रशिक्षण"
      ]
    },
    "correct": 0,
    "route": "/models?kind=q-learning",
    "source": "https://github.com/AI4Finance-Foundation/FinRL"
  },
  {
    "id": "sentiment",
    "title": {
      "en": "News, sentiment and AI assistants",
      "te": "వార్తలు, సెంటిమెంట్ మరియు AI సహాయకులు",
      "hi": "समाचार, सेंटिमेंट और AI सहायक"
    },
    "body": {
      "en": "Check the original filing and timestamp, then compare a headline with what was already expected. Sentiment labels are not price forecasts. LLMs can invent facts or citations. This app’s offline headline demo is a small keyword rule, not FinBERT or a trained predictor.",
      "te": "అసలు నివేదిక, సమయం చూడండి; వార్తను ముందున్న అంచనాలతో పోల్చండి. సెంటిమెంట్ లేబుల్ ధర అంచనా కాదు. LLM తప్పుడు నిజాలు, మూలాలు సృష్టించవచ్చు. ఇక్కడ ఆఫ్‌లైన్ వార్త డెమో చిన్న కీలకపద నియమం; FinBERT లేదా శిక్షణ మోడల్ కాదు.",
      "hi": "मूल रिपोर्ट और समय जाँचें, फिर खबर को पहले की अपेक्षाओं से तुलना करें। सेंटिमेंट भाव का पूर्वानुमान नहीं। LLM तथ्य या स्रोत बना सकता है। ऑफलाइन खबर डेमो छोटे शब्द नियम हैं; FinBERT या प्रशिक्षित मॉडल नहीं."
    },
    "question": {
      "en": "Is a positive headline a certain winning buy?",
      "te": "మంచి వార్త లాభదాయక కొనుగోలుకు హామీనా?",
      "hi": "क्या सकारात्मक खबर लाभदायक खरीद की गारंटी है?"
    },
    "answers": {
      "en": [
        "No",
        "Yes",
        "Only with an AI label"
      ],
      "te": [
        "కాదు",
        "అవును",
        "AI లేబుల్‌తోనే"
      ],
      "hi": [
        "नहीं",
        "हाँ",
        "केवल AI लेबल के साथ"
      ]
    },
    "correct": 0,
    "route": "/research",
    "source": "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence"
  },
  {
    "id": "research",
    "title": {
      "en": "Research workflow and screeners",
      "te": "పరిశోధన విధానం మరియు స్క్రీనర్లు",
      "hi": "शोध प्रक्रिया और स्क्रीनर"
    },
    "body": {
      "en": "Use screeners to make a watchlist, then verify exchange filings, liquidity, valuation, news timing and concentration risk. Record why the thesis could fail. Public tools help investigate; none is a secret source of certain winners.",
      "te": "వాచ్‌లిస్ట్ కోసం స్క్రీనర్ వాడి ఎక్స్చేంజ్ నివేదికలు, లిక్విడిటీ, విలువ, వార్త సమయం, కేంద్రీకరణ రిస్క్ తనిఖీ చేయండి. మీ అంచనా ఎందుకు తప్పవచ్చో రాయండి. పబ్లిక్ టూల్స్ పరిశోధనకు సహాయం మాత్రమే; ఖచ్చిత విజేతల రహస్య మూలాలు కావు.",
      "hi": "स्क्रीनर से सूची बनाकर एक्सचेंज रिपोर्ट, लिक्विडिटी, मूल्यांकन, खबर का समय और एकाग्रता जोखिम जाँचें। अपनी धारणा क्यों गलत हो सकती है लिखें। सार्वजनिक औजार शोध में मदद करते हैं; निश्चित विजेता देने वाला गुप्त स्रोत नहीं."
    },
    "question": {
      "en": "What should follow a screener result?",
      "te": "స్క్రీనర్ ఫలితం తరువాత ఏమి చేయాలి?",
      "hi": "स्क्रीनर परिणाम के बाद क्या करें?"
    },
    "answers": {
      "en": [
        "Verify primary sources and risks",
        "Buy immediately",
        "Ignore liquidity"
      ],
      "te": [
        "మూలాలు, రిస్క్ తనిఖీ",
        "వెంటనే కొనడం",
        "లిక్విడిటీ పట్టించుకోకపోవడం"
      ],
      "hi": [
        "प्राथमिक स्रोत और जोखिम जाँचें",
        "तुरंत खरीदें",
        "लिक्विडिटी अनदेखी करें"
      ]
    },
    "correct": 0,
    "route": "/research",
    "source": "https://www.nseindia.com/companies-listing/corporate-filings-announcements"
  },
  {
    "id": "psychology",
    "title": {
      "en": "Journal, drawdown and discipline",
      "te": "జర్నల్, డ్రాడౌన్ మరియు క్రమశిక్షణ",
      "hi": "जर्नल, ड्रॉडाउन और अनुशासन"
    },
    "body": {
      "en": "Record your setup, invalidation, size and emotional state before trading. Drawdown is decline from a prior equity peak. After a 50% loss you need 100% gain to recover. A daily pause is useful; changing rules after losses can hide an unsuitable strategy.",
      "te": "ట్రేడ్ ముందు సెటప్, తప్పయ్యే పరిస్థితి, పరిమాణం, భావోద్వేగం రాయండి. డ్రాడౌన్ అంటే గత ఈక్విటీ గరిష్ఠం నుంచి తగ్గుదల. 50% నష్టం తర్వాత తిరిగి రావడానికి 100% లాభం కావాలి. రోజువారీ విరామం ఉపయోగం; నష్టం తర్వాత నియమాలు మార్చడం లోపాలను దాచవచ్చు.",
      "hi": "ट्रेड से पहले सेटअप, गलत होने की शर्त, आकार और भावना लिखें। ड्रॉडाउन पिछले इक्विटी शिखर से गिरावट है। 50% नुकसान बाद वापसी को 100% लाभ चाहिए। दैनिक विराम उपयोगी है; नुकसान बाद नियम बदलना कमजोर रणनीति छुपा सकता है."
    },
    "question": {
      "en": "After a 50% loss, how much gain recovers the original balance?",
      "te": "50% నష్టం తరువాత మొదటి బ్యాలెన్స్‌కు ఎంత లాభం కావాలి?",
      "hi": "50% नुकसान बाद मूल बैलेंस के लिए कितना लाभ चाहिए?"
    },
    "answers": {
      "en": [
        "100%",
        "50%",
        "25%"
      ],
      "te": [
        "100%",
        "50%",
        "25%"
      ],
      "hi": [
        "100%",
        "50%",
        "25%"
      ]
    },
    "correct": 0,
    "route": "/journal",
    "source": "https://www.investor.gov/introduction-investing"
  },
  {
    "id": "reality",
    "title": {
      "en": "Paper results versus real execution",
      "te": "వర్చువల్ ఫలితాలు మరియు అసలు అమలు",
      "hi": "वर्चुअल परिणाम और असली निष्पादन"
    },
    "body": {
      "en": "Paper profits are not income. Live quotes can be delayed, and a simulator omits order book depth, queue position, funding, taxes and market impact. Index values are not directly tradable shares. Real trading needs suitable products, regulated access and money you can afford to lose.",
      "te": "వర్చువల్ లాభాలు ఆదాయం కాదు. ధరలు ఆలస్యం కావచ్చు; సిమ్యులేటర్‌లో ఆర్డర్ బుక్ లోతు, క్యూ, ఫండింగ్, పన్ను, మార్కెట్ ప్రభావం ఉండవు. ఇండెక్స్ విలువ నేరుగా కొనగల షేర్ కాదు. అసలు ట్రేడింగ్‌కు తగిన ఉత్పత్తులు, నియంత్రిత ప్రవేశం, నష్టపోగల డబ్బు అవసరం.",
      "hi": "वर्चुअल मुनाफा आय नहीं है। भाव देर से आ सकते हैं; सिम्युलेटर में ऑर्डर बुक, कतार, फंडिंग, कर और बाजार प्रभाव नहीं हैं। इंडेक्स मूल्य सीधे खरीदने का शेयर नहीं। असली ट्रेडिंग में उचित उत्पाद, विनियमित पहुँच और खो सकने वाला पैसा चाहिए."
    },
    "question": {
      "en": "Can this app’s paper profits be withdrawn?",
      "te": "ఈ యాప్ వర్చువల్ లాభాలను తీసుకోవచ్చా?",
      "hi": "क्या ऐप का वर्चुअल मुनाफा निकाला जा सकता है?"
    },
    "answers": {
      "en": [
        "No",
        "Yes",
        "Only after a challenge"
      ],
      "te": [
        "కాదు",
        "అవును",
        "ఛాలెంజ్ తరువాతే"
      ],
      "hi": [
        "नहीं",
        "हाँ",
        "केवल चैलेंज के बाद"
      ]
    },
    "correct": 0,
    "route": "/live",
    "source": "https://www.investor.gov/introduction-investing/investing-basics/investment-products"
  }
]

/** Display-order rotation is separate from the stored answer index. */
export function getLessonChoiceOrder(lessonIndex: number, answerCount: number): number[] {
  if (!Number.isInteger(lessonIndex) || lessonIndex < 0 || !Number.isInteger(answerCount) || answerCount < 1)
    return []
  const offset = lessonIndex % answerCount
  return Array.from({ length: answerCount }, (_, index) => (index + offset) % answerCount)
}
