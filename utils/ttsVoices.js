const readEnv = (name) => process.env[name]?.replace?.(/[\"']/g, "").trim();

const animeDefaultReference = () => readEnv("NATSUMI_FISH_REF_ANIME_DEFAULT") || readEnv("NATSUMI_FISH_REF_SPIKY") || readEnv("NATSUMI_FISH_REF_SPEAKY") || readEnv("NATSUMI_FISH_REF_FEMALE") || "8ef4a238714b45718ce04243307c57a7";
const jpDefaultReference = () => readEnv("NATSUMI_FISH_REF_JP_DEFAULT") || readEnv("NATSUMI_FISH_REF_JP") || animeDefaultReference();

export const TTS_VOICES = [
  {
    label: "스피키 - 한국어 애니 하이톤",
    name: "스피키",
    value: "fish:speaky",
    voiceId: "fish:speaky",
    referenceEnv: "NATSUMI_FISH_REF_SPEAKY",
    aliases: ["스피키", "Speaky", "Spiky"],
    description: "밝고 높은 애니 캐릭터톤",
    locale: "ko",
    gender: "female",
  },
  {
    label: "카프카 - 한국어 차분한 캐릭터",
    name: "카프카",
    value: "fish:kafka",
    voiceId: "fish:kafka",
    referenceEnv: "NATSUMI_FISH_REF_KAFKA",
    aliases: ["카프카", "Kafka"],
    description: "우아하고 낮게 깔리는 여성 캐릭터톤",
    locale: "ko",
    gender: "female",
  },
  {
    label: "소라2 - 한국어 활발한 애니톤",
    name: "소라2",
    value: "fish:sora2",
    voiceId: "fish:sora2",
    referenceEnv: "NATSUMI_FISH_REF_SORA2",
    aliases: ["소라2", "Sora2"],
    description: "밝고 에너지 있는 여성 애니톤",
    locale: "ko",
    gender: "female",
  },
  {
    label: "냥이 - 한국어 귀여운 캐릭터",
    name: "냥이",
    value: "fish:nyang",
    voiceId: "fish:nyang",
    referenceEnv: "NATSUMI_FISH_REF_NYANG",
    aliases: ["냥이"],
    description: "가볍고 귀여운 캐릭터 목소리",
    locale: "ko",
    gender: "female",
  },
  {
    label: "마카 - 한국어 통통 튀는 캐릭터",
    name: "마카",
    value: "fish:maka",
    voiceId: "fish:maka",
    referenceEnv: "NATSUMI_FISH_REF_MAKA",
    aliases: ["마카", "마카앤로니"],
    description: "짧고 통통 튀는 애니 캐릭터톤",
    locale: "ko",
    gender: "female",
  },
  {
    label: "20대 여자 쇼츠 - 한국어 밝은 여성",
    name: "20대 여자_나긋나긋 쇼츠",
    value: "fish:ko_shorts_female",
    voiceId: "fish:ko_shorts_female",
    referenceEnv: "NATSUMI_FISH_REF_KO_SHORTS_FEMALE",
    aliases: ["20대 여자_나긋나긋 쇼츠", "쇼츠여성"],
    description: "밝고 친근한 한국어 여성톤",
    locale: "ko",
    gender: "female",
  },
  {
    label: "단비 - 한국어 장난스러운 여성",
    name: "단비",
    value: "fish:danbi",
    voiceId: "fish:danbi",
    referenceEnv: "NATSUMI_FISH_REF_DANBI",
    aliases: ["단비"],
    description: "발랄하고 장난기 있는 여성톤",
    locale: "ko",
    gender: "female",
  },
  {
    label: "애니메이션 - 한국어 캐릭터톤",
    name: "애니메이션",
    value: "fish:animation_ko",
    voiceId: "fish:animation_ko",
    referenceEnv: "NATSUMI_FISH_REF_ANIMATION_KO",
    aliases: ["애니메이션", "애니메이션김문"],
    description: "애니메이션 대사에 어울리는 여성톤",
    locale: "ko",
    gender: "female",
  },
  {
    label: "구하리 - 한국어 애니 캐릭터",
    name: "구하리",
    value: "fish:guhari",
    voiceId: "fish:guhari",
    referenceEnv: "NATSUMI_FISH_REF_GUHARI",
    aliases: ["구하리"],
    description: "감정 표현이 있는 애니 캐릭터톤",
    locale: "ko",
    gender: "female",
  },
  {
    label: "나츠미 기본 - 한국어 애니 여성",
    name: "나츠미 기본",
    value: "fish:natsumi_default",
    voiceId: "fish:natsumi_default",
    referenceEnv: "NATSUMI_FISH_REF_ANIME_DEFAULT",
    aliases: ["나츠미 기본", "기본"],
    description: "나츠미 기본 애니 여성 보이스",
    locale: "ko",
    gender: "female",
  },

  {
    label: "일본 애니 여성 A",
    name: "일본 애니 여성 A",
    value: "fish:jp_anime_a",
    voiceId: "fish:jp_anime_a",
    referenceEnv: "NATSUMI_FISH_REF_JP_ANIME_A",
    aliases: ["일본 애니 여성 A"],
    description: "일본어 애니 여성 캐릭터톤",
    locale: "ja",
    gender: "female",
  },
  {
    label: "일본 애니 여성 B",
    name: "일본 애니 여성 B",
    value: "fish:jp_anime_b",
    voiceId: "fish:jp_anime_b",
    referenceEnv: "NATSUMI_FISH_REF_JP_ANIME_B",
    aliases: ["일본 애니 여성 B"],
    description: "밝은 일본어 애니 여성톤",
    locale: "ja",
    gender: "female",
  },
  {
    label: "일본 캐릭터 소녀",
    name: "일본 캐릭터 소녀",
    value: "fish:jp_character_girl",
    voiceId: "fish:jp_character_girl",
    referenceEnv: "NATSUMI_FISH_REF_JP_CHARACTER_GIRL",
    aliases: ["일본 캐릭터 소녀"],
    description: "귀여운 일본어 소녀 캐릭터톤",
    locale: "ja",
    gender: "female",
  },
  {
    label: "일본 차분한 여성",
    name: "일본 차분한 여성",
    value: "fish:jp_soft_female",
    voiceId: "fish:jp_soft_female",
    referenceEnv: "NATSUMI_FISH_REF_JP_SOFT_FEMALE",
    aliases: ["일본 차분한 여성"],
    description: "부드럽고 차분한 일본어 여성톤",
    locale: "ja",
    gender: "female",
  },
  {
    label: "일본 활발한 여성",
    name: "일본 활발한 여성",
    value: "fish:jp_energy_female",
    voiceId: "fish:jp_energy_female",
    referenceEnv: "NATSUMI_FISH_REF_JP_ENERGY_FEMALE",
    aliases: ["일본 활발한 여성"],
    description: "활발한 일본어 애니톤",
    locale: "ja",
    gender: "female",
  },
  {
    label: "일본 애니 소년톤",
    name: "일본 애니 소년톤",
    value: "fish:jp_boyish",
    voiceId: "fish:jp_boyish",
    referenceEnv: "NATSUMI_FISH_REF_JP_BOYISH",
    aliases: ["일본 애니 소년톤"],
    description: "소년 캐릭터 느낌의 일본어톤",
    locale: "ja",
    gender: "female",
  },
  {
    label: "일본 나츠미 추천",
    name: "일본 나츠미 추천",
    value: "fish:jp_natsumi",
    voiceId: "fish:jp_natsumi",
    referenceEnv: "NATSUMI_FISH_REF_JP_DEFAULT",
    aliases: ["일본 나츠미 추천"],
    description: "나츠미가 추천하는 일본어 애니 보이스",
    locale: "ja",
    gender: "female",
  },
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
