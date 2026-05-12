const jpReference = () => process.env.NATSUMI_FISH_REF_JP || "8ef4a238714b45718ce04243307c57a7";
const femaleReference = () => process.env.NATSUMI_FISH_REF_FEMALE || "8ef4a238714b45718ce04243307c57a7";
const maleReference = () => process.env.NATSUMI_FISH_REF_MALE || "802e3bc2b27e49c2995d23ef70e6ac89";

export const TTS_VOICES = [
  { label: "애니보이스 서연 - 한국어 여성", name: "애니보이스 서연 - 한국어 여성", value: "Seoyeon", description: "부드럽고 안정적인 한국어 여성 목소리", locale: "ko", gender: "female" },
  { label: "애니보이스 수아 - 한국어 밝은 여성", name: "애니보이스 수아 - 한국어 밝은 여성", value: "Seoyeon", description: "밝고 또렷한 한국어 여성 목소리", locale: "ko", gender: "female" },
  { label: "애니보이스 나리 - 한국어 캐릭터톤", name: "애니보이스 나리 - 한국어 캐릭터톤", value: "Seoyeon", description: "가볍고 귀여운 한국어 캐릭터 목소리", locale: "ko", gender: "female" },
  { label: "애니보이스 하린 - 한국어 차분한 여성", name: "애니보이스 하린 - 한국어 차분한 여성", value: "Seoyeon", description: "조용하고 차분하게 읽는 한국어 여성 목소리", locale: "ko", gender: "female" },
  { label: "애니보이스 유나 - 한국어 안내 여성", name: "애니보이스 유나 - 한국어 안내 여성", value: "Seoyeon", description: "안내 방송처럼 선명한 한국어 여성 목소리", locale: "ko", gender: "female" },
  { label: "애니보이스 민준 - 한국어 남성", name: "애니보이스 민준 - 한국어 남성", value: "Seoyeon", description: "낮고 차분한 한국어 남성 목소리", locale: "ko", gender: "male" },
  { label: "애니보이스 도윤 - 한국어 밝은 남성", name: "애니보이스 도윤 - 한국어 밝은 남성", value: "Seoyeon", description: "밝고 친근한 한국어 남성 목소리", locale: "ko", gender: "male" },
  { label: "애니보이스 지훈 - 한국어 해설톤", name: "애니보이스 지훈 - 한국어 해설톤", value: "Seoyeon", description: "해설과 진행에 어울리는 한국어 남성 목소리", locale: "ko", gender: "male" },
  { label: "애니보이스 태오 - 한국어 소년톤", name: "애니보이스 태오 - 한국어 소년톤", value: "Seoyeon", description: "가볍고 빠른 한국어 소년 느낌 목소리", locale: "ko", gender: "male" },
  { label: "애니보이스 라온 - 한국어 중성톤", name: "애니보이스 라온 - 한국어 중성톤", value: "Seoyeon", description: "부담 없는 한국어 중성 목소리", locale: "ko", gender: "female" },

  { label: "애니보이스 미즈키 - 일본어 여성", name: "애니보이스 미즈키 - 일본어 여성", value: "Mizuki", description: "기본 일본어 여성 목소리", locale: "ja", gender: "female" },
  { label: "애니보이스 하루 - 일본어 캐릭터톤", name: "애니보이스 하루 - 일본어 캐릭터톤", value: "Mizuki", description: "애니풍에 가까운 일본어 캐릭터 목소리", locale: "ja", gender: "female" },
  { label: "애니보이스 소라 - 일본어 차분한 여성", name: "애니보이스 소라 - 일본어 차분한 여성", value: "Mizuki", description: "차분하게 읽는 일본어 여성 목소리", locale: "ja", gender: "female" },
  { label: "애니보이스 아오이 - 일본어 밝은 여성", name: "애니보이스 아오이 - 일본어 밝은 여성", value: "Mizuki", description: "밝고 선명한 일본어 여성 목소리", locale: "ja", gender: "female" },
  { label: "애니보이스 유이 - 일본어 귀여운톤", name: "애니보이스 유이 - 일본어 귀여운톤", value: "Mizuki", description: "귀엽고 가벼운 일본어 목소리", locale: "ja", gender: "female" },
  { label: "애니보이스 렌 - 일본어 소년톤", name: "애니보이스 렌 - 일본어 소년톤", value: "Mizuki", description: "소년 캐릭터 느낌의 일본어 목소리", locale: "ja", gender: "female" },
  { label: "애니보이스 카나 - 일본어 안내톤", name: "애니보이스 카나 - 일본어 안내톤", value: "Mizuki", description: "또렷하게 안내하는 일본어 목소리", locale: "ja", gender: "female" },
  { label: "애니보이스 리나 - 일본어 부드러운톤", name: "애니보이스 리나 - 일본어 부드러운톤", value: "Mizuki", description: "부드럽고 느긋한 일본어 목소리", locale: "ja", gender: "female" },
  { label: "애니보이스 나츠 - 일본어 활발한톤", name: "애니보이스 나츠 - 일본어 활발한톤", value: "Mizuki", description: "활발한 캐릭터 느낌의 일본어 목소리", locale: "ja", gender: "female" },
  { label: "애니보이스 시온 - 일본어 중성톤", name: "애니보이스 시온 - 일본어 중성톤", value: "Mizuki", description: "차분한 일본어 중성 목소리", locale: "ja", gender: "female" },
];

export const DEFAULT_TTS_VOICE = TTS_VOICES[0];

export const getTtsVoiceByValue = (value) => {
  return TTS_VOICES.find((voice) => voice.value === value || voice.name === value) || DEFAULT_TTS_VOICE;
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
  const envKey = `NATSUMI_FISH_REF_${voice.name.replace(/[^0-9A-Za-z가-힣]/g, "_").toUpperCase()}`;
  if (process.env[envKey]) return process.env[envKey];

  if (voice.locale === "ja") return jpReference();
  if (voice.gender === "male") return maleReference();
  return femaleReference();
};

export const isStaticTtsVoiceId = (voiceId) => {
  return TTS_VOICES.some((voice) => voice.value === voiceId || voice.name === voiceId);
};
