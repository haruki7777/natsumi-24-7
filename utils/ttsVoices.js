const jpReference = () => process.env.NATSUMI_FISH_REF_JP || "8ef4a238714b45718ce04243307c57a7";
const femaleReference = () => process.env.NATSUMI_FISH_REF_FEMALE || "8ef4a238714b45718ce04243307c57a7";
const maleReference = () => process.env.NATSUMI_FISH_REF_MALE || "802e3bc2b27e49c2995d23ef70e6ac89";

export const TTS_VOICES = [
  {
    label: "서연 - 한국어 여성",
    name: "서연 - 한국어 여성",
    value: "Seoyeon",
    description: "기본 한국어 여성 목소리",
    locale: "ko",
    gender: "female",
  },
  {
    label: "민준 - 한국어 남성",
    name: "민준 - 한국어 남성",
    value: "Seoyeon",
    description: "낮고 차분한 한국어 남성 목소리",
    locale: "ko",
    gender: "male",
  },
  {
    label: "수아 - 한국어 밝은톤",
    name: "수아 - 한국어 밝은톤",
    value: "Seoyeon",
    description: "밝고 또렷한 한국어 여성 목소리",
    locale: "ko",
    gender: "female",
  },
  {
    label: "도윤 - 한국어 안내톤",
    name: "도윤 - 한국어 안내톤",
    value: "Seoyeon",
    description: "공지나 안내에 어울리는 한국어 남성 목소리",
    locale: "ko",
    gender: "male",
  },
  {
    label: "나리 - 한국어 캐릭터톤",
    name: "나리 - 한국어 캐릭터톤",
    value: "Seoyeon",
    description: "조금 더 귀엽고 가벼운 한국어 목소리",
    locale: "ko",
    gender: "female",
  },
  {
    label: "미즈키 - 일본어 여성",
    name: "미즈키 - 일본어 여성",
    value: "Mizuki",
    description: "기본 일본어 여성 목소리",
    locale: "ja",
    gender: "female",
  },
  {
    label: "하루 - 일본어 캐릭터톤",
    name: "하루 - 일본어 캐릭터톤",
    value: "Mizuki",
    description: "애니풍에 가까운 일본어 여성 목소리",
    locale: "ja",
    gender: "female",
  },
  {
    label: "소라 - 일본어 차분한톤",
    name: "소라 - 일본어 차분한톤",
    value: "Mizuki",
    description: "차분하게 읽는 일본어 여성 목소리",
    locale: "ja",
    gender: "female",
  },
  {
    label: "렌 - 일본어 소년톤",
    name: "렌 - 일본어 소년톤",
    value: "Mizuki",
    description: "가벼운 캐릭터 느낌의 일본어 목소리",
    locale: "ja",
    gender: "female",
  },
  {
    label: "아오이 - 일본어 밝은톤",
    name: "아오이 - 일본어 밝은톤",
    value: "Mizuki",
    description: "밝고 선명한 일본어 목소리",
    locale: "ja",
    gender: "female",
  },
];

export const DEFAULT_TTS_VOICE = TTS_VOICES[0];

export const getTtsVoiceByValue = (value) => {
  return TTS_VOICES.find((voice) => voice.value === value || voice.name === value) || DEFAULT_TTS_VOICE;
};

export const getFishReferenceId = (voiceName) => {
  const voice = getTtsVoiceByValue(voiceName);
  const envKey = `NATSUMI_FISH_REF_${voice.name.replace(/[^0-9A-Za-z가-힣]/g, "_").toUpperCase()}`;
  if (process.env[envKey]) return process.env[envKey];

  if (voice.locale === "ja") return jpReference();
  if (voice.gender === "male") return maleReference();
  return femaleReference();
};

export const isStaticTtsVoiceId = (voiceId) => {
  return TTS_VOICES.some((voice) => voice.value === voiceId || voice.name === voiceId);
};

const stringifyVoiceField = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) return value.map(stringifyVoiceField).join(" ");
  if (typeof value === "object") return Object.values(value).map(stringifyVoiceField).join(" ");
  return String(value);
};

const hasAny = (text, patterns) => patterns.some((pattern) => pattern.test(text));

const blockedLanguagePatterns = [
  /\bar\b|\barabic\b|العربية|عربي/i,
  /\ben\b|\benglish\b|american|british/i,
  /\bzh\b|\bcn\b|\bchinese\b|mandarin|cantonese|中文|普通话/i,
  /\bfr\b|\bfrench\b|\bes\b|\bspanish\b|\bde\b|\bgerman\b|\bru\b|\brussian\b/i,
  /\bpt\b|\bportuguese\b|\bth\b|\bthai\b|\bvi\b|\bvietnamese\b|\bid\b|\bindonesian\b/i,
];

const koPatterns = [
  /[가-힣]/,
  /\bko\b|\bko-kr\b|\bkr\b|\bkorean\b|한국|한국어|서울/i,
];

const jaPatterns = [
  /[ぁ-んァ-ン一-龯]/,
  /\bja\b|\bja-jp\b|\bjp\b|\bjapanese\b|日本|日本語|にほんご/i,
];

const getFishVoiceLocale = (voice) => {
  const text = [
    voice.title,
    voice.description,
    voice.language,
    voice.locale,
    voice.lang,
    voice.languages,
    voice.tags,
  ].map(stringifyVoiceField).join(" ");

  if (hasAny(text, blockedLanguagePatterns)) return null;
  if (hasAny(text, koPatterns)) return "한국어";
  if (hasAny(text, jaPatterns)) return "일본어";
  return null;
};

const getFishVoiceStyle = (voice) => {
  const text = [
    voice.title,
    voice.description,
    voice.tags,
  ].map(stringifyVoiceField).join(" ").toLowerCase();

  if (/anime|character|애니|캐릭터|ゲーム|game/.test(text)) return "애니/캐릭터";
  if (/female|woman|girl|여성|여자|소녀/.test(text)) return "여성";
  if (/male|man|boy|남성|남자|소년/.test(text)) return "남성";
  if (/calm|soft|차분|부드/.test(text)) return "차분한 톤";
  return "일반 보이스";
};

const normalizeTitle = (voice, locale, index) => {
  const title = String(voice.title || "").replace(/\s+/g, " ").trim();
  if (title && title.length <= 42) return title;
  return `${locale} 보이스 ${index}`;
};

const makeVoiceOption = (voice, locale, index) => {
  const title = normalizeTitle(voice, locale, index);
  const style = getFishVoiceStyle(voice);
  return {
    label: `${title} - ${locale}`.slice(0, 100),
    name: `${title} - ${locale}`,
    value: `fish:${voice._id}`,
    voiceId: voice._id,
    description: `스타일: ${style}`.slice(0, 100),
  };
};

export const fetchFishAudioVoiceOptions = async ({ limit = 5, locale: localeFilter = null } = {}) => {
  const apiKey = process.env.FISH_API_KEY || process.env.NATSUMI_FISH_AUDIO_API_KEY;
  const found = [];
  const localeCounts = new Map();
  const seen = new Set();

  for (let page = 1; page <= 8 && found.length < limit; page += 1) {
    const url = new URL("https://api.fish.audio/model");
    url.searchParams.set("page_size", "50");
    url.searchParams.set("page_number", String(page));
    url.searchParams.set("sort_by", "task_count");

    const response = await fetch(url, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout?.(8000),
    });
    if (!response.ok) throw new Error(`Fish voices ${response.status}`);

    const data = await response.json();
    const items = data.items || [];
    for (const voice of items) {
      if (!voice?._id || seen.has(voice._id)) continue;
      seen.add(voice._id);

      const locale = getFishVoiceLocale(voice);
      if (!locale) continue;
      if (localeFilter && locale !== localeFilter) continue;

      const nextCount = (localeCounts.get(locale) || 0) + 1;
      localeCounts.set(locale, nextCount);
      found.push(makeVoiceOption(voice, locale, nextCount));

      if (found.length >= limit) break;
    }

    if (items.length === 0) break;
  }

  return found;
};
