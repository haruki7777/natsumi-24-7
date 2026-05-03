
import axios from "axios";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("애니짤")
    .setDescription("귀여운 애니메이션 이미지를 보여준다냥!")
    .addStringOption((option) =>
      option
        .setName("카테고리")
        .setDescription("보고 싶은 짤의 카테고리를 선택해 주세요")
        .setRequired(true)
        .addChoices(
          { name: "와이프 (Waifu)", value: "waifu" },
          { name: "네코 (Neko)", value: "neko" },
          { name: "키츠네 (Kitsune)", value: "kitsune" },
          { name: "허스밴도 (Husbando)", value: "husbando" },
          { name: "껴안기 (Hug)", value: "hug" },
          { name: "키스 (Kiss)", value: "kiss" },
          { name: "두드리기 (Pat) ", value: "pat" },
          { name: "싸대기 (Slap)", value: "slap" },
          { name: "스마일 (Smile)", value: "smile" },
          { name: "윙크 (Wink)", value: "wink" },
          { name: "댄스 (Dance)", value: "dance" },
          { name: "행복 (Happy)", value: "happy" },
          { name: "하이파이브 (Highfive)", value: "highfive" },
          { name: "깨물기 (Bite)", value: "bite" },
          { name: "찌르기 (Poke)", value: "poke" },
          { name: "부끄러움 (Blush)", value: "blush" },
          { name: "잘난척 (Smug)", value: "smug" },
          { name: "졸림 (Sleep)", value: "sleep" },
          { name: "먹기 (Nom)", value: "nom" },
          { name: "웃기 (Laugh)", value: "laugh" },
          { name: "삐짐 (Pout)", value: "pout" },
          { name: "바보 (Baka)", value: "baka" },
          { name: "화남 (Angry)", value: "angry" }
        )
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply();
    const category = interaction.options.getString("카테고리");
 
    let imageUrl = "";
    let source = "";

    // Common headers
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NatsumiBot/1.2"
    };

    // Mapping for waifu.im SFW
    const waifuImSfwTags = ["waifu", "maid", "marin-kitagawa", "mori-calliope", "raiden-shogun", "selfies", "uniform", "oppai"];
    
    // Mapping for nekos.best SFW
    const nekosBestEndpoints = [
        "waifu", "neko", "kitsune", "husbando", "bored", "busy", "cheer", "clap", "cry", "cuddle", 
        "dance", "facepalm", "feed", "handhold", "happy", "highfive", "hug", "kick", "kiss", 
        "laugh", "lick", "lurk", "nod", "nom", "nope", "pat", "peck", "poke", "pout", "punch", 
        "shoot", "shrug", "slap", "sleep", "smile", "smug", "stare", "think", "thumbsup", "tickle", "wave", "wink", "yeet"
    ];

    // Mapping for waifu.pics SFW
    const waifuPicsSfwTags = [
        "waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", "awoo", "kiss", 
        "lick", "pat", "smug", "bonk", "yeet", "blush", "smile", "wave", "highfive", "handhold", 
        "nom", "bite", "glomp", "slap", "kill", "kick", "happy", "wink", "poke", "dance", "cringe"
    ];

    try {
      // 1순위: waifu.im (Priority as requested)
      if (waifuImSfwTags.includes(category)) {
        try {
          const resp = await axios.get(`https://api.waifu.im/search`, {
            params: { included_tags: category, is_nsfw: false },
            headers,
            timeout: 7000
          });
          if (resp.data.images && resp.data.images[0]) {
            imageUrl = resp.data.images[0].url;
            source = "waifu.im";
          }
        } catch (e) {
           // Skip to next source
        }
      }

      // 2순위: nekos.best
      if (!imageUrl && nekosBestEndpoints.includes(category)) {
        try {
          const resp = await axios.get(`https://nekos.best/api/v2/${category}`, { 
            headers,
            timeout: 7000 
          });
          if (resp.data.results && resp.data.results[0]) {
            imageUrl = resp.data.results[0].url;
            source = "nekos.best";
          }
        } catch (e) {
           // Skip
        }
      }

      // 3순위: waifu.pics
      if (!imageUrl && waifuPicsSfwTags.includes(category)) {
        try {
          const resp = await axios.get(`https://api.waifu.pics/sfw/${category}`, { 
            headers,
            timeout: 7000 
          });
          if (resp.data.url) {
            imageUrl = resp.data.url;
            source = "waifu.pics";
          }
        } catch (e) {
           // Skip
        }
      }

      // Final fallback
      if (!imageUrl) {
          try {
              const resp = await axios.get(`https://api.waifu.pics/sfw/waifu`, { headers, timeout: 5000 });
              if (resp.data.url) {
                  imageUrl = resp.data.url;
                  source = "waifu.pics (fallback)";
              }
          } catch (e) {}
      }

      if (!imageUrl) throw new Error("Image not found");

      const embed = new EmbedBuilder()
        .setTitle(`✨ ${category}!! 귀엽다냥!`)
        .setImage(imageUrl)
        .setFooter({ text: `Source: ${source} | 나츠미 봇` })
        .setTimestamp()
        .setColor("Random");

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      interaction.editReply({ content: "**이미지 서버가 불안정하다냥! 다시 시도해 달라냥!**" });
    }
  },
};
