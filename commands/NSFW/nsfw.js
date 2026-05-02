
const axios = require("axios");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("NSFW 이미지를 보여준다냥 (후방주의!)")
    .setNSFW(true) // Ensure Discord marks this properly
    .addStringOption((option) =>
      option
        .setName("카테고리")
        .setDescription("보고 싶은 짤의 카테고리를 선택해 주세요")
        .setRequired(true)
        .addChoices(
          { name: "H-와이프 (H-Waifu)", value: "waifu" },
          { name: "H-네코 (H-Neko)", value: "neko" },
          { name: "헤타이 (Hentai)", value: "hentai" },
          { name: "에로 (Ero)", value: "ero" },
          { name: "에치 (Ecchi)", value: "ecchi" },
          { name: "밀프 (Milf)", value: "milf" },
          { name: "파이즈리 (Paizuri)", value: "paizuri" },
          { name: "오랄 (Oral)", value: "oral" },
          { name: "블로우잡 (Blowjob)", value: "blowjob" },
          { name: "트랩 (Trap)", value: "trap" }
        )
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.deferred && !interaction.replied) await interaction.deferReply();

    // Secondary check for NSFW channel
    if (!interaction.channel || !interaction.channel.nsfw) {
      return interaction.editReply({
        content: "⚠️ **이 명령어는 NSFW 채널에서만 사용할 수 있다냥!**",
        ephemeral: true
      });
    }

    const category = interaction.options.getString("카테고리");
    
    let imageUrl = "";
    let source = "";

    // Common headers
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NatsumiBot/1.2"
    };

    // Mapping for waifu.im
    const waifuImTags = ["waifu", "maid", "hentai", "milf", "oral", "paizuri", "ecchi", "ero", "ass", "oppai"];
    // Mapping for waifu.pics
    const waifuPicsTags = ["waifu", "neko", "trap", "blowjob"];

    try {
      // Logic: Try waifu.im first (as requested). If it fails or tag not supported, try fallbacks.
      // Optimization: For common tags, we can even try multiple in parallel to find the fastest response (Dual Link)
      
      // Attempt 1: waifu.im
      if (waifuImTags.includes(category)) {
          try {
              const resp = await axios.get(`https://api.waifu.im/search`, {
                  params: { included_tags: category, is_nsfw: true },
                  headers,
                  timeout: 7000
              });
              if (resp.data.images && resp.data.images[0]) {
                  imageUrl = resp.data.images[0].url;
                  source = "waifu.im";
              }
          } catch (e) {
              console.error(`[waifu.im] ${category} failed:`, e.message);
          }
      }

      // Attempt 2: waifu.pics (Reliable second choice)
      if (!imageUrl && waifuPicsTags.includes(category)) {
          try {
              const resp = await axios.get(`https://api.waifu.pics/nsfw/${category}`, { headers, timeout: 7000 });
              if (resp.data.url) {
                  imageUrl = resp.data.url;
                  source = "waifu.pics";
              }
          } catch (e) {
              console.error(`[waifu.pics] ${category} failed:`, e.message);
          }
      }

      // Attempt 3: hmtai (High stability fallback)
      if (!imageUrl) {
          try {
              const resp = await axios.get(`https://hmtai.hatsunemiku.tk/v2/${category === "waifu" ? "nsfw" : category}`, { headers, timeout: 5000 });
              if (resp.data.url) {
                  imageUrl = resp.data.url;
                  source = "hmtai";
              }
          } catch (e) {
              // Ignore hmtai failure
          }
      }

      // Attempt 4: nekos.best (Third priority as requested, though limited NSFW)
      if (!imageUrl) {
          const nekosBestEndpoints = ["waifu", "neko"];
          if (nekosBestEndpoints.includes(category)) {
              try {
                  const resp = await axios.get(`https://nekos.best/api/v2/${category}`, { headers, timeout: 5000 });
                  if (resp.data.results && resp.data.results[0]) {
                      imageUrl = resp.data.results[0].url;
                      source = "nekos.best";
                  }
              } catch (e) {}
          }
      }

      // Final fallback: Random ero from waifu.im if everything else fails
      if (!imageUrl) {
          try {
              const resp = await axios.get(`https://api.waifu.im/search`, {
                  params: { is_nsfw: true, included_tags: "ero" },
                  headers,
                  timeout: 5000
              });
              if (resp.data.images && resp.data.images[0]) {
                  imageUrl = resp.data.images[0].url;
                  source = "waifu.im (fallback)";
              }
          } catch (e) {}
      }

      if (!imageUrl) throw new Error("Image not found from any API");

      const embed = new EmbedBuilder()
        .setTitle(`🔞 당신은 변태인거냐냥?! (${category})`)
        .setDescription(`**후방주의 하라냥!** <a:KemomimiDance:1048568057599119370>`)
        .setImage(imageUrl)
        .setFooter({ text: `Source: ${source} | 나츠미 봇` })
        .setTimestamp()
        .setColor("Red");

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("NSFW image fetch error:", error);
      await interaction.editReply({ content: "**이미지 서버가 불안정하다냥! 잠시 후 다시 시도해 보라냥!**" });
    }
  },
};
