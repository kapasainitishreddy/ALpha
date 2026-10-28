import type { Language } from '@/lib/i18n'

// Short correction keyed by the selected wrong answer index; indexes match curriculum.ts.
export const LESSON_WRONG_FEEDBACK: Record<string, Record<Language, Record<number, string>>> = {
  options: {
    en: { 1: 'Delta measures sensitivity to the underlying price; theta measures time sensitivity. Neither one alone predicts the option’s next value.', 2: 'Vega measures sensitivity to implied volatility; theta measures time sensitivity. Other inputs can offset time decay.' },
    te: { 1: 'డెల్టా అండర్లయింగ్ ధర సున్నితత్వం; థీటా సమయ సున్నితత్వం. ఒక్కటి మాత్రమే ఆప్షన్ తదుపరి విలువను అంచనా వేయదు.', 2: 'వేగా ఇంప్లైడ్ వోలాటిలిటీ సున్నితత్వం; థీటా సమయ సున్నితత్వం. ఇతర మార్పులు సమయ ప్రభావాన్ని తగ్గించవచ్చు.' },
    hi: { 1: 'डेल्टा अंडरलाइंग भाव के प्रति संवेदनशीलता है; थीटा समय के प्रति। कोई एक अकेले ऑप्शन का अगला मूल्य नहीं बताता।', 2: 'वेगा इम्प्लाइड वोलैटिलिटी के प्रति संवेदनशीलता है; थीटा समय के प्रति। दूसरे बदलाव समय के असर को संतुलित कर सकते हैं।' },
  },
  futures: {
    en: { 1: 'Margin is collateral posted for a futures position, not its maximum loss. Daily variation and gaps can require more cash or create losses beyond posted margin.', 2: 'Margin is collateral for both long and short futures; it caps neither side’s loss. Daily variation and gaps can require more cash or exceed posted margin.' },
    te: { 1: 'ఫ్యూచర్స్ మార్జిన్ అనేది స్థానం కోసం ఉంచే కొలాటరల్; గరిష్ఠ నష్టం కాదు. రోజువారీ మార్పులు, గ్యాప్‌లు మరింత నగదు అవసరం చేయవచ్చు లేదా మార్జిన్‌కు మించిన నష్టం కలిగించవచ్చు.', 2: 'లాంగ్, షార్ట్ రెండింటికీ ఫ్యూచర్స్ మార్జిన్ కొలాటరల్ మాత్రమే; ఏ వైపు నష్టాన్నీ పరిమితం చేయదు. రోజువారీ మార్పులు, గ్యాప్‌లు మరింత నగదు కోరవచ్చు లేదా ఉంచిన మార్జిన్‌ను మించిన నష్టం కలిగించవచ్చు.' },
    hi: { 1: 'फ्यूचर्स मार्जिन पोजिशन के लिए जमा कोलेटरल है, अधिकतम नुकसान नहीं। दैनिक बदलाव और गैप अधिक नकदी माँग सकते हैं या जमा मार्जिन से अधिक नुकसान दे सकते हैं।', 2: 'लॉन्ग और शॉर्ट दोनों फ्यूचर्स में मार्जिन कोलेटरल है; यह किसी भी तरफ का नुकसान सीमित नहीं करता। दैनिक बदलाव और गैप अधिक नकदी माँग सकते हैं या जमा मार्जिन से अधिक नुकसान करा सकते हैं।' },
  },
  spreads: {
    en: { 1: 'A long straddle needs enough expiry movement to recover both premiums; a small move can still lose money.', 2: 'A straddle contains both a call and a put; both premiums and their expiry payoffs matter.' },
    te: { 1: 'లాంగ్ స్ట్రాడిల్‌లో గడువు నాడు రెండు ప్రీమియంలను తిరిగి పొందేంత కదలిక అవసరం; చిన్న కదలికలోనూ నష్టం రావచ్చు.', 2: 'స్ట్రాడిల్‌లో కాల్, పుట్ రెండూ ఉంటాయి; రెండు ప్రీమియంలు, గడువు పే-ఆఫ్‌లు ముఖ్యం.' },
    hi: { 1: 'लॉन्ग स्ट्रैडल में समाप्ति पर दोनों प्रीमियम वसूलने जितनी चाल चाहिए; छोटी चाल पर भी नुकसान हो सकता है।', 2: 'स्ट्रैडल में कॉल और पुट दोनों हैं; दोनों प्रीमियम और समाप्ति पेऑफ मायने रखते हैं।' },
  },
}
