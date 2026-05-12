const jpReference = () => process.env.NATSUMI_FISH_REF_JP || "8ef4a238714b45718ce04243307c57a7";
const femaleReference = () => process.env.NATSUMI_FISH_REF_FEMALE || "8ef4a238714b45718ce04243307c57a7";
const maleReference = () => process.env.NATSUMI_FISH_REF_MALE || "802e3bc2b27e49c2995d23ef70e6ac89";

export const TTS_VOICES = [
  {
    label: "한국어 여성",
    name: "한국어 여성",
    value: "Seoyeon",
    description: "기본 한국어 여성 목소리",
    locale: "ko",
    gender: "female",
  },
  {
    label: "한국어 남성",
    name: "한국어 남성",
    value: "Seoyeon",
    description: "Fish Audio 키가 있을 때 한국어 남성 참고 음성을 사용해요.",
    locale: "ko",
    gender: "male",
  },
  {
    label: "일본어 여성",
    name: "일본어 여성",
    value: "Mizuki",
    description: "기본 일본어 여성 목소리",
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

  if (/female|woman|girl|여성|여자|소녀/.test(text)) return "여성";
  if (/male|man|boy|남성|남자|소년/.test(text)) return "남성";
  if (/anime|character|애니|캐릭터/.test(text)) return "애니/캐릭터";
  return "보이스";
};

const makeKoreanLabel = (voice, locale, index) => {
  void voice;
  return `${locale} 보이스 ${index}`.slice(0, 100);
};

export const fetchFishAudioVoiceOptions = async ({ limit = 25, locale: localeFilter = null } = {}) => {
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
      const label = makeKoreanLabel(voice, locale, nextCount);
      const style = getFishVoiceStyle(voice);

      found.push({
        label,
        name: label,
        value: `fish:${voice._id}`,
        voiceId: voice._id,
        description: `Fish Audio · ${locale} · ${style}`.slice(0, 100),
      });

      if (found.length >= limit) break;
    }

    if (items.length === 0) break;
  }

  return found;
};
