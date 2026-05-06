
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import axios from "axios";

export default {
  data: new SlashCommandBuilder()
    .setName("sfw")
    .setDescription("건전하고 귀여운 애니메이션 짤을 보여줄게! 콘콘!")
    .addStringOption((option) =>
      option
        .setName("카테고리")
        .setDescription("어떤 종류의 짤을 감상할래?")
        .setRequired(true)
        .addChoices(
          { name: "와이프 (Waifu)", value: "waifu" },
          { name: "네코 (Neko)", value: "neko" },
          { name: "메이드 (Maid)", value: "maid" },
          { name: "교복 (Uniform)", value: "uniform" },
          { name: "마린 (Marin-Kitagawa)", value: "marin-kitagawa" },
          { name: "모리 (Mori-Calliope)", value: "mori-calliope" },
          { name: "라이덴 (Raiden-Shogun)", value: "raiden-shogun" },
          { name: "시노부 (Shinobu)", value: "shinobuu" },
          { name: "껴안기 (Hug)", value: "hug" },
          { name: "키스 (Kiss)", value: "kiss" },
          { name: "두드리기 (Pat)", value: "pat" },
          { name: "울기 (Cry)", value: "cry" },
          { name: "싸대기 (Slap)", value: "slap" },
          { name: "스마일 (Smile)", value: "smile" },
          { name: "윙크 (Wink)", value: "wink" },
          { name: "댄스 (Dance)", value: "dance" },
          { name: "행복 (Happy)", value: "happy" },
          { name: "하대 (Smug)", value: "smug" },
          { name: "먹방 (Nom)", value: "nom" },
          { name: "졸림 (Sleep)", value: "sleep" }
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

    // Common headers to prevent 403 errors
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
      // Priority 1: waifu.im
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
             // Skip silently to next
        }
      }

      // Priority 2: nekos.best (Parallel check if waifu.im failed)
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

      // Priority 3: waifu.pics
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
        .setTitle(`🏮 ${category} 짤 감상 시간이야!`)
        .setDescription(`**흥! 네 취향이 이런 쪽이었어? 별로 상관없지만 말이야! 콘콘!**`)
        .setImage(imageUrl)
        .setAuthor({ name: "나츠미의 갤러리", iconURL: interaction.client.user.displayAvatarURL() })
        .setFooter({ text: `영력 출처: ${source} | 나츠미의 보물상자` })
        .setTimestamp()
        .setColor("#FF7F50");

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("Anime image fetch error:", error);
      await interaction.editReply({ content: "이미지 서버에 여우불이 꺼졌어! (오류 발생) 나중에 다시 해봐! 흥!" });
    }
  },
};
