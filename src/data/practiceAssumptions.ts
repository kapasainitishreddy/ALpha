import type { Language } from '@/lib/i18n'
import type { Experiment } from '@/lib/modelExperiments'

export const REPLAY_ASSUMPTIONS: Record<Language, string> = {
  en: 'Bar replay assumptions: if a bar touches both stop and target, the stop is chosen because OHLC has no intrabar order. A stop gap fills at the open, not the requested stop price. A pending fill within a bar cannot also hit a same-bar target unless it was executable at the open. Corporate actions and survivorship bias are not corrected; imported/history data may be incomplete or adjusted differently. This is not evidence of a live edge.',
  te: 'క్యాండిల్ రీప్లే ఊహలు: ఒకే క్యాండిల్ స్టాప్, లక్ష్యం రెండింటినీ తాకితే OHLC క్రమం తెలియదు కాబట్టి స్టాప్‌ను ముందుగా ఎంచుకుంటాం. స్టాప్ గ్యాప్ అయితే అభ్యర్థించిన స్టాప్ ధరకు కాకుండా ఓపెన్ ధరకు అమలు అవుతుంది. క్యాండిల్ మధ్యలో నిండిన పెండింగ్ ఆర్డర్ అదే క్యాండిల్ లక్ష్యాన్ని తాకదు; ఓపెన్ వద్దనే అమలయ్యే పరిస్థితి అయితే మినహాయింపు. కార్పొరేట్ చర్యలు, ప్రస్తుతం నిలిచిన కంపెనీలకే చరిత్ర పరిమితం కావడం సరిచేయబడవు; దిగుమతి/చరిత్ర డేటా అసంపూర్ణంగా లేదా వేరే సర్దుబాట్లతో ఉండవచ్చు. ఇది లైవ్ లాభదాయకతకు సాక్ష్యం కాదు.',
  hi: 'बार रीप्ले की धारणाएँ: एक बार स्टॉप और लक्ष्य दोनों छुए तो OHLC में क्रम नहीं होता, इसलिए स्टॉप पहले माना जाता है। स्टॉप गैप होने पर भराव माँगे गए स्टॉप भाव पर नहीं, खुले भाव पर होता है। बार के भीतर भरा लंबित ऑर्डर उसी बार का लक्ष्य नहीं छू सकता, जब तक वह ओपन पर निष्पादन योग्य न हो। कॉर्पोरेट कार्रवाई और केवल बचे हुए शेयरों का पक्षपात सुधारा नहीं जाता; आयात/इतिहास डेटा अधूरा या अलग तरह से समायोजित हो सकता है। यह लाइव बढ़त का प्रमाण नहीं है।',
}

export const MODEL_RETURN_ASSUMPTIONS: Record<Language, string> = {
  en: 'These are abstract close-to-close return experiments, not order-execution backtests. A signal reads bar i close and applies exposure to the return from close i to close i+1, idealizing that the close is immediately available. They omit real order timing, queue position, market impact and many venue costs. Results are synthetic research outputs, not proof of a profitable strategy.',
  te: 'ఇవి క్లోజ్-టు-క్లోజ్ రిటర్న్‌లపై గణిత ప్రయోగాలు; ఆర్డర్ అమలుతో కూడిన బ్యాక్‌టెస్టులు కావు. సిగ్నల్ i క్యాండిల్ క్లోజ్‌ను చూసి, i క్లోజ్ నుంచి i+1 క్లోజ్ వరకూ రిటర్న్‌పై స్థానం వర్తింపజేస్తుంది; క్లోజ్ ధర వెంటనే అందుబాటులో ఉందని సరళీకరిస్తుంది. నిజమైన ఆర్డర్ సమయం, క్యూ స్థానం, మార్కెట్ ప్రభావం, అనేక ఎక్స్చేంజ్ ఖర్చులు లేవు. ఇవి సింథటిక్ పరిశోధన ఫలితాలు మాత్రమే; లాభదాయక వ్యూహానికి రుజువు కావు.',
  hi: 'ये क्लोज-से-क्लोज रिटर्न पर अमूर्त प्रयोग हैं, ऑर्डर निष्पादन वाले बैकटेस्ट नहीं। संकेत बार i के बंद भाव को पढ़ता है और i से i+1 बंद भाव तक के रिटर्न पर स्थिति लागू करता है; इसमें बंद भाव तुरंत उपलब्ध मान लिया जाता है। वास्तविक ऑर्डर समय, कतार स्थान, बाजार प्रभाव और कई विनिमय खर्च शामिल नहीं हैं। ये काल्पनिक शोध परिणाम हैं, लाभकारी रणनीति का प्रमाण नहीं।',
}

export const EXPERIMENT_ASSUMPTIONS: Record<Experiment, Record<Language, string>> = {
  pairs: {
    en: 'Pairs: the second price series is invented and correlated by construction. Correlation does not establish cointegration or a stable hedge. Borrow availability/cost, covariance risk and simultaneous two-leg fills are not modeled.',
    te: 'పెయిర్స్: రెండో ధర శ్రేణి కల్పితం; నిర్మాణం వల్ల సహసంబంధం కలిగి ఉంటుంది. సహసంబంధం కాయిన్‌టిగ్రేషన్ లేదా స్థిర హెడ్జ్‌ను నిరూపించదు. షేర్ అప్పు లభ్యత/ఖర్చు, కోవేరియన్స్ రిస్క్, రెండు లెగ్‌లు ఒకేసారి నిండటం మోడల్ చేయబడలేదు.',
    hi: 'पेयर: दूसरी मूल्य श्रृंखला गढ़ी गई है और बनावट से सहसंबद्ध है। सहसंबंध कॉइंटीग्रेशन या स्थिर हेज सिद्ध नहीं करता। उधार उपलब्धता/खर्च, सहप्रसरण जोखिम और दोनों लेग का एक साथ भरना मॉडल में नहीं है।',
  },
  grid: {
    en: 'Grid: a synthetic long-only grid uses five fixed levels 1% apart, up to 3% notional per level. Candle touches stand in for fills; queue priority, spread and latency are absent. New inventory cannot exit on the same bar.',
    te: 'గ్రిడ్: కల్పిత లాంగ్-ఓన్లీ గ్రిడ్‌లో 1% దూరంలో ఐదు స్థిర స్థాయిలు, ఒక్కో స్థాయికి గరిష్ఠంగా 3% నామమాత్ర విలువ. క్యాండిల్ తాకుడే అమలుగా పరిగణిస్తాం; క్యూ ప్రాధాన్యం, స్ప్రెడ్, ఆలస్యం లేవు. కొత్త ఇన్వెంటరీ అదే క్యాండిల్‌లో బయటకు రాదు.',
    hi: 'ग्रिड: काल्पनिक केवल-लॉन्ग ग्रिड में 1% दूरी पर पाँच स्थिर स्तर हैं, हर स्तर पर अधिकतम 3% नाममात्र मूल्य। कैंडल का छूना भराव माना गया है; कतार प्राथमिकता, स्प्रेड और विलंब शामिल नहीं। नई इन्वेंटरी उसी बार में बाहर नहीं निकलती।',
  },
  'market-making': {
    en: 'Market making: fill behavior is an invented adverse-flow rule, not observed order-book data. There is no real book depth, queue priority, latency or venue rebate model. Inventory limits and quote widths are teaching assumptions.',
    te: 'మార్కెట్ మేకింగ్: అమలు ప్రవర్తన కల్పిత ప్రతికూల-ఫ్లో నియమం; ఇది గమనించిన ఆర్డర్‌బుక్ డేటా కాదు. నిజమైన బుక్ లోతు, క్యూ ప్రాధాన్యం, ఆలస్యం, ఎక్స్చేంజ్ రిబేట్ మోడల్ లేవు. ఇన్వెంటరీ పరిమితులు, కోట్ వెడల్పులు బోధనా ఊహలు.',
    hi: 'मार्केट मेकिंग: भराव व्यवहार गढ़ा हुआ प्रतिकूल-प्रवाह नियम है, देखा गया ऑर्डर-बुक डेटा नहीं। असली बुक गहराई, कतार प्राथमिकता, विलंब या एक्सचेंज रिबेट मॉडल नहीं है। इन्वेंटरी सीमा और कोट चौड़ाई केवल शिक्षण धारणाएँ हैं।',
  },
  arbitrage: {
    en: 'Arbitrage: venue prices and the 8% second-leg failure rate are invented, not measured. Both legs are charged, but real simultaneous fills, transfer delays, borrow, conversion and market impact are not modeled. The failure rate is an arbitrary scenario input, not an empirical estimate.',
    te: 'ఆర్బిట్రాజ్: మార్కెట్ ధరలు, రెండో లెగ్ విఫలమయ్యే 8% రేటు కల్పితం; కొలిచినవి కావు. రెండు లెగ్‌లకూ ఖర్చు వేస్తాం, కానీ నిజమైన ఏకకాల అమలు, బదిలీ ఆలస్యం, అప్పు, కరెన్సీ మార్పు, మార్కెట్ ప్రభావం మోడల్ చేయబడలేదు. 8% అనేది యాదృచ్ఛిక సన్నివేశ ఊహ మాత్రమే; అనుభవాధార అంచనా కాదు.',
    hi: 'आर्बिट्राज: बाजार भाव और दूसरी लेग की 8% विफलता दर गढ़ी गई है, मापी नहीं गई। दोनों लेग पर खर्च लगता है, पर वास्तविक एक-साथ निष्पादन, हस्तांतरण विलंब, उधार, मुद्रा रूपांतरण और बाजार प्रभाव मॉडल नहीं हैं। 8% केवल मनमानी परिदृश्य धारणा है, अनुभवजन्य अनुमान नहीं।',
  },
  allocation: {
    en: 'Allocation: three correlated asset paths are synthetic. Inverse-volatility weights use only the first 60%; covariance, rebalancing, realistic asset selection and associated costs are omitted. This is a fixed-weight illustration.',
    te: 'కేటాయింపు: మూడు సహసంబంధ ఆస్తి మార్గాలు కల్పితం. మొదటి 60% డేటాతోనే ఇన్వర్స్-వోలాటిలిటీ బరువులు లెక్కిస్తాం; కోవేరియన్స్, రీబ్యాలెన్సింగ్, వాస్తవ ఆస్తి ఎంపిక, వాటి ఖర్చులు లేవు. ఇది స్థిర బరువుల ఉదాహరణ మాత్రమే.',
    hi: 'आवंटन: तीन सहसंबद्ध परिसंपत्ति पथ काल्पनिक हैं। इन्वर्स-वोलैटिलिटी भार केवल पहले 60% डेटा से बनते हैं; सहप्रसरण, रीबैलेंसिंग, वास्तविक परिसंपत्ति चयन और उसके खर्च शामिल नहीं। यह स्थिर भार का उदाहरण है।',
  },
  regression: {
    en: 'Regression: this is a one-feature OLS rule on synthetic closes, fitted on the first 60% and frozen. It is an abstract close-to-close return model under the idealized timing above, not an executable trade backtest.',
    te: 'రిగ్రెషన్: కల్పిత క్లోజ్‌లపై ఒక ఫీచర్ ఉన్న OLS నియమం; మొదటి 60%తో ఫిట్ చేసి స్థిరపరుస్తాం. పై ఆదర్శీకరించిన సమయ ఊహతో క్లోజ్-టు-క్లోజ్ రిటర్న్ మోడల్ మాత్రమే; అమలు చేయగల ట్రేడ్ బ్యాక్‌టెస్ట్ కాదు.',
    hi: 'रिग्रेशन: काल्पनिक बंद भाव पर एक-फीचर OLS नियम है; पहले 60% पर फिट कर स्थिर किया जाता है। ऊपर बताई आदर्श समय-धारणा वाला क्लोज-से-क्लोज रिटर्न मॉडल है, निष्पादन योग्य ट्रेड बैकटेस्ट नहीं।',
  },
  'q-learning': {
    en: 'Q-learning: a small tabular policy learns on synthetic returns for fixed-seed episodes, then freezes for the later segment. Its reward includes a simplified turnover cost; it is not a production trading model or an executable backtest.',
    te: 'Q-లెర్నింగ్: చిన్న పట్టిక పాలసీ స్థిర సీడ్ ఎపిసోడ్‌లలో కల్పిత రిటర్న్‌లపై నేర్చుకుని, తర్వాతి భాగంలో మారదు. రివార్డ్‌లో సరళీకరించిన టర్నోవర్ ఖర్చు ఉంది; ఇది ఉత్పత్తి ట్రేడింగ్ మోడల్ లేదా అమలు బ్యాక్‌టెస్ట్ కాదు.',
    hi: 'Q-लर्निंग: छोटी टेबल नीति निश्चित सीड वाले एपिसोड में काल्पनिक रिटर्न पर सीखती है, फिर बाद के हिस्से में स्थिर रहती है। रिवॉर्ड में सरल टर्नओवर लागत है; यह उत्पादन ट्रेडिंग मॉडल या निष्पादन बैकटेस्ट नहीं।',
  },
}

export const DERIVATIVE_LAB_ASSUMPTIONS: Record<Language, string> = {
  en: 'Teaching model only: one app unit uses multiplier 1; this is not a current exchange contract size or lot. Option values use a European-style expiry model with flat IV; there is no exercise/assignment path, bid-ask liquidity, physical delivery or tax model. Futures use synthetic units, 10% initial and 50% maintenance rules, and daily variation. Entry and exit each charge 0.03% fee plus 0.05% friction. Margin is collateral, not a maximum loss; gaps can exceed it.',
  te: 'బోధనా మోడల్ మాత్రమే: ఒక యాప్ యూనిట్‌కు మల్టిప్లయర్ 1; ఇది ప్రస్తుతం ఉన్న ఎక్స్చేంజ్ కాంట్రాక్ట్ పరిమాణం లేదా లాట్ కాదు. ఆప్షన్ విలువలు స్థిర IVతో యూరోపియన్-శైలి గడువు నమూనా; ఎక్సర్సైజ్/అసైన్‌మెంట్ మార్గం, బిడ్-ఆస్క్ లిక్విడిటీ, భౌతిక డెలివరీ, పన్ను మోడల్ లేవు. ఫ్యూచర్స్‌కు కల్పిత యూనిట్లు, 10% ప్రారంభ మరియు 50% నిర్వహణ నియమాలు, రోజువారీ వేరియేషన్ ఉన్నాయి. ఎంట్రీ, ఎగ్జిట్ రెండింటికీ 0.03% ఫీజు + 0.05% ఫ్రిక్షన్. మార్జిన్ గరిష్ఠ నష్టం కాదు; గ్యాప్ వల్ల దాన్ని మించవచ్చు.',
  hi: 'केवल शिक्षण मॉडल: एक ऐप यूनिट का गुणक 1 है; यह वर्तमान एक्सचेंज कॉन्ट्रैक्ट आकार या लॉट नहीं। ऑप्शन मूल्य स्थिर IV वाला यूरोपीय-शैली समाप्ति मॉडल है; एक्सरसाइज/असाइनमेंट प्रक्रिया, बिड-आस्क लिक्विडिटी, भौतिक डिलीवरी या कर मॉडल नहीं। फ्यूचर्स में काल्पनिक यूनिट, 10% प्रारंभिक और 50% रखरखाव नियम तथा दैनिक वैरिएशन हैं। एंट्री और एग्जिट पर 0.03% शुल्क + 0.05% friction लगता है। मार्जिन अधिकतम नुकसान नहीं; गैप इसे पार कर सकता है।',
}
