import axios from "axios";

const headers = {
  "User-Agent": "NatsumiBot/6.0 (+https://github.com/haruki7777/natsumi-24-7)",
};

const request = async (url, options = {}) => {
  return axios.get(url, {
    headers,
    timeout: 7000,
    validateStatus: (status) => status >= 200 && status < 500,
    ...options,
  });
};

export const sfwCategories = [
  { name: "Waifu", value: "waifu" },
  { name: "Neko", value: "neko" },
  { name: "Kitsune", value: "kitsune" },
  { name: "Husbando", value: "husbando" },
  { name: "Hug", value: "hug" },
  { name: "Kiss", value: "kiss" },
  { name: "Pat", value: "pat" },
  { name: "Slap", value: "slap" },
  { name: "Smile", value: "smile" },
  { name: "Wink", value: "wink" },
  { name: "Dance", value: "dance" },
  { name: "Happy", value: "happy" },
  { name: "Highfive", value: "highfive" },
  { name: "Bite", value: "bite" },
  { name: "Poke", value: "poke" },
  { name: "Blush", value: "blush" },
  { name: "Smug", value: "smug" },
  { name: "Sleep", value: "sleep" },
  { name: "Nom", value: "nom" },
  { name: "Laugh", value: "laugh" },
  { name: "Pout", value: "pout" },
  { name: "Cry", value: "cry" },
  { name: "Wave", value: "wave" },
];

export const nsfwCategories = [
  { name: "Hentai", value: "hentai" },
  { name: "Ero", value: "ero" },
  { name: "Ecchi", value: "ecchi" },
  { name: "Ass", value: "ass" },
  { name: "Paizuri", value: "paizuri" },
  { name: "MILF", value: "milf" },
  { name: "Oral", value: "oral" },
  { name: "Maid", value: "maid" },
  { name: "Oppai", value: "oppai" },
];

export const nsfw2Categories = [
  { name: "Hentai", value: "hentai" },
  { name: "Ass", value: "ass" },
  { name: "Boobs", value: "boobs" },
  { name: "Paizuri", value: "paizuri" },
  { name: "HNeko", value: "hneko" },
  { name: "HKitsune", value: "hkitsune" },
  { name: "Kemonomimi", value: "kemonomimi" },
  { name: "Kanna", value: "kanna" },
  { name: "Holo", value: "holo" },
  { name: "PGif", value: "pgif" },
  { name: "4K", value: "4k" },
  { name: "Anal", value: "anal" },
  { name: "Blowjob", value: "blowjob" },
  { name: "Pussy", value: "pussy" },
  { name: "Thigh", value: "thigh" },
  { name: "Yaoi", value: "yaoi" },
  { name: "Yuri", value: "yuri" },
];

export const nsfw3Categories = [
  { name: "Collared", value: "collared" },
  { name: "Cosplay", value: "cosplay" },
  { name: "Cumsluts", value: "cumsluts" },
  { name: "Feet", value: "feet" },
  { name: "Gonewild", value: "gonewild" },
  { name: "Swimsuit", value: "swimsuit" },
  { name: "Tentacle", value: "tentacle" },
  { name: "Pantsu", value: "pantsu" },
  { name: "Neko", value: "neko" },
  { name: "Nakadashi", value: "nakadashi" },
  { name: "Futa", value: "futa" },
  { name: "Pee", value: "pee" },
  { name: "Tummy", value: "tummy" },
];

export const getCategoryLabel = (categories, value) => {
  return categories.find((category) => category.value === value)?.name || value;
};

const waifuPicsSfw = new Set([
  "waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug",
  "awoo", "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile",
  "wave", "highfive", "handhold", "nom", "bite", "glomp", "slap", "kill",
  "kick", "happy", "wink", "poke", "dance", "cringe",
]);

const nekosBestSfw = new Set([
  "waifu", "neko", "kitsune", "husbando", "bored", "busy", "cheer", "clap",
  "cry", "cuddle", "dance", "facepalm", "feed", "handhold", "happy",
  "highfive", "hug", "kick", "kiss", "laugh", "lick", "lurk", "nod", "nom",
  "nope", "pat", "peck", "poke", "pout", "punch", "shoot", "shrug", "slap",
  "sleep", "smile", "smug", "stare", "think", "thumbsup", "tickle", "wave",
  "wink", "yeet",
]);

const waifuImSfw = new Set(["waifu", "maid", "marin-kitagawa", "mori-calliope", "raiden-shogun", "selfies", "uniform"]);
const waifuImNsfw = new Set(["hentai", "ero", "ecchi", "ass", "paizuri", "milf", "oral"]);
const waifuPicsNsfwMap = {
  hentai: "waifu",
  ero: "waifu",
  ecchi: "waifu",
  oral: "blowjob",
  oppai: "neko",
};
const nekobotNsfwMap = {
  ass: "hass",
  oppai: "boobs",
  oral: "blowjob",
  milf: "paizuri",
};

export const fetchSfwImage = async (category) => {
  const candidates = [];

  if (waifuPicsSfw.has(category)) {
    candidates.push(async () => {
      const resp = await request(`https://api.waifu.pics/sfw/${category}`);
      const url = resp?.data?.url;
      if (!url) throw new Error("waifu.pics missing url");
      return { url, source: "waifu.pics" };
    });
  }

  if (nekosBestSfw.has(category)) {
    candidates.push(async () => {
      const resp = await request(`https://nekos.best/api/v2/${category}`);
      const url = resp?.data?.results?.[0]?.url;
      if (!url) throw new Error("nekos.best missing url");
      return { url, source: "nekos.best" };
    });
  }

  if (waifuImSfw.has(category)) {
    candidates.push(async () => {
      const resp = await request("https://api.waifu.im/search", {
        params: { included_tags: category, is_nsfw: false },
      });
      const url = resp?.data?.images?.[0]?.url;
      if (!url) throw new Error("waifu.im missing url");
      return { url, source: "waifu.im" };
    });
  }

  if (candidates.length > 0) {
    try {
      return await Promise.any(candidates.map((candidate) => candidate()));
    } catch {
      // Fall through to final fallback.
    }
  }

  const fallbackNekos = await request("https://nekos.best/api/v2/waifu").catch(() => null);
  const fallbackNekosUrl = fallbackNekos?.data?.results?.[0]?.url;
  if (fallbackNekosUrl) return { url: fallbackNekosUrl, source: "nekos.best fallback" };

  const fallback = await request("https://api.waifu.pics/sfw/waifu").catch(() => null);
  const url = fallback?.data?.url;
  if (url) return { url, source: "waifu.pics fallback" };
  throw new Error(`No SFW image for ${category}`);
};

export const fetchNsfwImage = async (category) => {
  if (waifuImNsfw.has(category)) {
    const resp = await request("https://api.waifu.im/search", {
      params: { included_tags: category, is_nsfw: true },
    }).catch(() => null);
    const url = resp?.data?.images?.[0]?.url;
    if (url) return { url, source: "waifu.im" };
  }

  const waifuPicsType = waifuPicsNsfwMap[category];
  if (waifuPicsType) {
    const resp = await request(`https://api.waifu.pics/nsfw/${waifuPicsType}`).catch(() => null);
    const url = resp?.data?.url;
    if (url) return { url, source: "waifu.pics" };
  }

  const nekobotType = nekobotNsfwMap[category] || category;
  const resp = await request(`https://nekobot.xyz/api/image?type=${encodeURIComponent(nekobotType)}`).catch(() => null);
  const url = resp?.data?.message;
  if (url) return { url, source: "nekobot.xyz" };

  const fallback = await request("https://api.waifu.pics/nsfw/waifu").catch(() => null);
  const fallbackUrl = fallback?.data?.url;
  if (fallbackUrl) return { url: fallbackUrl, source: "waifu.pics fallback" };
  throw new Error(`No NSFW image for ${category}`);
};

export const fetchNsfw2Image = async (category) => {
  const primary = await request(`https://nekobot.xyz/api/image?type=${encodeURIComponent(category)}`).catch(() => null);
  const url = primary?.data?.message;
  if (url) return { url, source: "nekobot.xyz" };
  return fetchNsfwImage(category);
};

export const fetchNsfw3Image = fetchNsfw2Image;
