const readEnv = (name) => process.env[name]?.replace?.(/[\"']/g, "").trim();

const animeDefaultReference = () =>
  readEnv("NATSUMI_FISH_REF_ANIME_DEFAULT")
  || readEnv("NATSUMI_FISH_REF_SPEAKY")
  || readEnv("NATSUMI_FISH_REF_FEMALE")
  || "8ef4a238714b45718ce04243307c57a7";

const jpDefaultReference = () =>
  readEnv("NATSUMI_FISH_REF_JP_DEFAULT")
  || readEnv("NATSUMI_FISH_REF_JP")
  || animeDefaultReference();

export const TTS_VOICES = [
  { label: "한국어 여성 - 포근한 안내", name: "한국어 여성 포근한 안내", value: "ko_warm_female", voiceId: "ko_warm_female", referenceEnv: "NATSUMI_FISH_REF_KO_WARM_FEMALE", description: "부드럽고 친절한 한국어 여성 목소리", locale: "ko", gender: "female" },
  { label: "한국어 여성 - 밝은 애니톤", name: "한국어 여성 밝은 애니톤", value: "ko_bright_girl", voiceId: "ko_bright_girl", referenceEnv: "NATSUMI_FISH_REF_KO_BRIGHT_GIRL", description: "밝고 또렷한 애니 캐릭터 느낌", locale: "ko", gender: "female" },
  { label: "한국어 여성 - 차분한 나레이션", name: "한국어 여성 차분한 나레이션", value: "ko_soft_narrator", voiceId: "ko_soft_narrator", referenceEnv: "NATSUMI_FISH_REF_KO_SOFT_NARRATOR", description: "차분하고 안정적인 안내 목소리", locale: "ko", gender: "female" },
  { label: "한국어 소녀 - 경쾌한 말투", name: "한국어 소녀 경쾌한 말투", value: "ko_youthful", voiceId: "ko_youthful", referenceEnv: "NATSUMI_FISH_REF_KO_YOUTHFUL", description: "가볍고 생기 있는 한국어 소녀 톤", locale: "ko", gender: "female" },
  { label: "한국어 기본 - 안정적인 목소리", name: "한국어 기본 안정적인 목소리", value: "Seoyeon", voiceId: "Seoyeon", aliases: ["ko_default"], description: "무료 기본 한국어 TTS", locale: "ko", gender: "female" },
  { label: "일본어 여성 - 애니 캐릭터", name: "일본어 여성 애니 캐릭터", value: "ja_anime_girl", voiceId: "ja_anime_girl", referenceEnv: "NATSUMI_FISH_REF_JA_ANIME_GIRL", description: "애니 캐릭터 느낌의 일본어 여성 톤", locale: "ja", gender: "female" },
  { label: "일본어 여성 - 부드러운 톤", name: "일본어 여성 부드러운 톤", value: "ja_soft_female", voiceId: "ja_soft_female", referenceEnv: "NATSUMI_FISH_REF_JA_SOFT_FEMALE", description: "부드럽고 조용한 일본어 여성 톤", locale: "ja", gender: "female" },
  { label: "일본어 소녀 - 활기찬 톤", name: "일본어 소녀 활기찬 톤", value: "ja_energy_girl", voiceId: "ja_energy_girl", referenceEnv: "NATSUMI_FISH_REF_JA_ENERGY_GIRL", description: "활기찬 일본어 애니 톤", locale: "ja", gender: "female" },
  { label: "일본어 기본 - 나레이션", name: "일본어 기본 나레이션", value: "Mizuki", voiceId: "Mizuki", aliases: ["ja_narrator"], description: "무료 기본 일본어 TTS", locale: "ja", gender: "female" },
  { label: "일본어 기본 - 안정적인 목소리", name: "일본어 기본 안정적인 목소리", value: "ja_default", voiceId: "ja_default", referenceEnv: "NATSUMI_FISH_REF_JA_DEFAULT", description: "안정적인 일본어 기본 목소리", locale: "ja", gender: "female" },
];

export const DEFAULT_TTS_VOICE = TTS_VOICES[0];

export const getTtsVoiceByValue = (value) => {
  if (!value) return DEFAULT_TTS_VOICE;
  return TTS_VOICES.find((voice) =>
    voice.value === value
    || voice.voiceId === value
    || voice.name === value
    || voice.label === value
    || voice.aliases?.includes?.(value)
  ) || DEFAULT_TTS_VOICE;
};

export const getTtsVoicesByCategory = (category) => {
  if (category === "ko") return TTS_VOICES.filter((voice) => voice.locale === "ko").slice(0, 10);
  if (category === "ja") return TTS_VOICES.filter((voice) => voice.locale === "ja").slice(0, 10);
  return [
    ...TTS_VOICES.filter((voice) => voice.locale === "ko").slice(0, 5),
    ...TTS_VOICES.filter((voice) => voice.locale === "ja").slice(0, 5),
  ];
};

export const getFishReferenceId = (voiceName) => {
  const voice = getTtsVoiceByValue(voiceName);
  if (voice.referenceEnv && readEnv(voice.referenceEnv)) return readEnv(voice.referenceEnv);

  const envKey = `NATSUMI_FISH_REF_${String(voice.name || voiceName || "").replace(/[^0-9A-Za-z가-힣]/g, "_").toUpperCase()}`;
  if (readEnv(envKey)) return readEnv(envKey);

  if (voice.locale === "ja") return jpDefaultReference();
  return animeDefaultReference();
};

export const isStaticTtsVoiceId = (voiceId) => {
  return TTS_VOICES.some((voice) => voice.value === voiceId || voice.voiceId === voiceId || voice.name === voiceId);
};
