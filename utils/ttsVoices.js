export const TTS_VOICES = [
  { label: "야옹이 - 16362명", name: "야옹이", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-어린이, #활기찬 #사랑스러운" },
  { label: "호빈이 - 12269명", name: "호빈이", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-어린이, #게임/애니" },
  { label: "수아 - 7556명", name: "수아", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-어린이, #교육/강의" },
  { label: "유리(기본값) - 6876명", name: "유리(기본값)", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-청년, #신뢰가는 #활기찬" },
  { label: "민준 - 5672명", name: "민준", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-청년, #신뢰가는 #카리스마있는" },
  { label: "서연 - 5053명", name: "서연", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-청년, #부드러운 #편안한" },
  { label: "베리 - 4494명", name: "베리", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-어린이, #게임/애니" },
  { label: "광광 - 4373명", name: "광광", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-청소년, #게임/애니" },
  { label: "일호 - 4213명", name: "일호", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-중년/할아버지, #게임/애니" },
  { label: "찬구 - 3304명", name: "찬구", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-청소년, #게임/애니" },
  { label: "사유리(일본어) - 3099명", name: "사유리(일본어)", value: "Mizuki", emoji: "♀️", description: "일본어, 여성-청년, #활기찬 #싹싹한" },
  { label: "하준 - 3089명", name: "하준", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-어린이, #활기찬 #사랑스러운" },
  { label: "야봉 - 2917명", name: "야봉", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-청소년, #게임/애니" },
  { label: "다인 - 2823명", name: "다인", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-어린이, #활기찬 #사랑스러운" },
  { label: "덕구 - 2649명", name: "덕구", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-어린이, #게임/애니" },
  { label: "토비 - 2624명", name: "토비", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-어린이, #게임/애니" },
  { label: "경태 - 2617명", name: "경태", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-청년, #신뢰가는 #활기찬" },
  { label: "지호 - 2608명", name: "지호", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-어린이, #게임/애니" },
  { label: "이현 - 2596명", name: "이현", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-청소년, #활기찬 #사랑스러운" },
  { label: "인준 - 2535명", name: "인준", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-청년, #신뢰가는 #차분한" },
  { label: "학철 - 2532명", name: "학철", value: "Seoyeon", emoji: "♂️", description: "한국어, 남성-중년, #광고/이벤트" },
  { label: "화난 아라 - 2525명", name: "화난 아라", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-청년, #활기찬 #차분한" },
  { label: "다인 2 - 2463명", name: "다인 2", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-어린이, #활기찬 #사랑스러운" },
  { label: "선희(불안정) - 2455명", name: "선희(불안정)", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-청년, #신뢰가는 #차분한" },
  { label: "보라 - 2450명", name: "보라", value: "Seoyeon", emoji: "♀️", description: "한국어, 여성-청소년, #차분한 #열정적인" },
];

export const DEFAULT_TTS_VOICE = TTS_VOICES.find((voice) => voice.name === "야옹이") || TTS_VOICES[0];

export const getTtsVoiceByValue = (value) => TTS_VOICES.find((voice) => voice.value === value || voice.name === value) || DEFAULT_TTS_VOICE;

export const getFishReferenceId = (voiceName) => {
  const voice = getTtsVoiceByValue(voiceName);
  const envKey = `NATSUMI_FISH_REF_${voice.name.replace(/[^0-9A-Za-z가-힣]/g, "_").toUpperCase()}`;
  if (process.env[envKey]) return process.env[envKey];

  if (voice.description.includes("일본어")) return process.env.NATSUMI_FISH_REF_JP || "8ef4a238714b45718ce04243307c57a7";
  if (voice.description.includes("남성")) return process.env.NATSUMI_FISH_REF_MALE || "802e3bc2b27e49c2995d23ef70e6ac89";
  return process.env.NATSUMI_FISH_REF_FEMALE || "8ef4a238714b45718ce04243307c57a7";
};

export const isStaticTtsVoiceId = (voiceId) => {
  return TTS_VOICES.some((voice) => voice.value === voiceId || voice.name === voiceId);
};

const getFishVoiceLocale = (voice) => {
  const haystack = [
    voice.title,
    voice.description,
    ...(voice.languages || []),
    ...(voice.tags || []),
  ].filter(Boolean).join(" ").toLowerCase();

  if (/한국|korean|\bko\b|ko-|kr|korea|seoul/.test(haystack)) return "한국어";
  if (/일본|japanese|\bja\b|ja-|jp|japan|nihongo|日本/.test(haystack)) return "일본어";
  return null;
};

const getFishVoiceStyle = (voice) => {
  const text = [...(voice.tags || []), voice.description || ""].join(" ").toLowerCase();
  if (/female|woman|girl|여성|소녀/.test(text)) return "여성";
  if (/male|man|boy|남성|소년/.test(text)) return "남성";
  if (/anime|애니|character|캐릭터/.test(text)) return "애니/캐릭터";
  return "보이스";
};

export const fetchFishAudioVoiceOptions = async ({ limit = 25 } = {}) => {
  const apiKey = process.env.FISH_API_KEY || process.env.NATSUMI_FISH_AUDIO_API_KEY;
  const found = [];
  const localeCounts = new Map();

  for (let page = 1; page <= 6 && found.length < limit; page += 1) {
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
      if (!voice?._id || !voice?.title) continue;
      const locale = getFishVoiceLocale(voice);
      if (!locale) continue;

      const title = String(voice.title).replace(/\s+/g, " ").trim();
      const style = getFishVoiceStyle(voice);
      const nextCount = (localeCounts.get(locale) || 0) + 1;
      localeCounts.set(locale, nextCount);
      const hasHangulTitle = /[가-힣]/.test(title);
      const displayName = hasHangulTitle ? `${locale} · ${title}` : `${locale} 보이스 ${nextCount}`;
      found.push({
        label: displayName.slice(0, 100),
        name: displayName,
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
