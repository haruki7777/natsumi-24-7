
import axios from "axios";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("nsfw")
    .setDescription("흥! 인간들의 은밀한 취향을 내가 보여줄게! (후방주의!)")
    .setNSFW(true) // Ensure Discord marks this properly
    .addStringOption((option) =>
      option
        .setName("카테고리")
        .setDescription("어떤 이상한 걸 보고 싶은 거야? 변태!")
        .setRequired(true)
        .addChoices(
          { name: "🔞 헨타이 (Hentai)", value: "hentai" },
          { name: "✨ 에로 (Ero)", value: "ero" },
          { name: "🩰 에치 (Ecchi)", value: "ecchi" },
          { name: "🍑 엉덩이 (Ass)", value: "ass" },
          { name: "🍼 파이즈리 (Paizuri)", value: "paizuri" },
          { name: "👩‍🦱 MILF", value: "milf" },
          { name: "👅 오랄 (Oral)", value: "oral" },
          { name: "🐱 메이드 (Maid)", value: "maid" },
          { name: "🍒 오파이 (Oppai)", value: "oppai" }
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
        content: "⚠️ **여기는 공공장소야! 이런 건 부끄러운 채널(NSFW)에서나 하라구!**",
        ephemeral: true
      });
    }

    const category = interaction.options.getString("카테고리");
    
    let imageUrl = "";
    let apiUsed = "waifu.im";

    // API Priority List
    // 1. Waifu.im (Primary - Categories rich)
    // 2. Waifu.pics (Fallback - High reliability)
    // 3. NekoBot (Emergency Fallback)

    try {
      // --- Provider 1: Waifu.im ---
      try {
        const nsfwTags = ["hentai", "ero", "ecchi", "ass", "paizuri", "milf", "oral", "oppai"];
        const isNsfwTag = nsfwTags.includes(category);
        
        const endpoints = [
          "https://api.waifu.im/search",
          "https://api.waifu.im/v2/search",
          "https://api.waifu.im/search/",
          "https://api.waifu.im/v2/search/"
        ];

        for (const endpoint of endpoints) {
          try {
            const queryParams = new URLSearchParams();
            queryParams.append("included_tags", category);
            queryParams.append("is_nsfw", isNsfwTag.toString());

            const resp = await axios.get(`${endpoint}?${queryParams.toString()}`, { 
              timeout: 5000,
              headers: { "User-Agent": "NatsumiBot/5.9.5" }
            });
            if (resp.data?.images?.[0]?.url) {
              imageUrl = resp.data.images[0].url;
              break;
            }
          } catch (e) { continue; }
        }
      } catch (err) {
        console.warn("Waifu.im failed, moving to fallback...");
      }

      // --- Provider 2: Waifu.pics (if Waifu.im failed) ---
      if (!imageUrl) {
        try {
          apiUsed = "waifu.pics";
          // Mapping categories to waifu.pics types (waifu, neko, trap, blowjob)
          let wpType = "waifu";
          if (category === "oral") wpType = "blowjob";
          
          const wpResp = await axios.get(`https://api.waifu.pics/nsfw/${wpType}`, { timeout: 5000 });
          if (wpResp.data?.url) {
            imageUrl = wpResp.data.url;
          }
        } catch (err) {
          console.warn("Waifu.pics failed, moving to emergency fallback...");
        }
      }

      // --- Provider 3: NekoBot (Emergency) ---
      if (!imageUrl) {
        try {
          apiUsed = "nekobot.xyz";
          // Mapping to NekoBot types (hentai, hass, paizuri, boobs, etc.)
          let nbType = "hentai";
          if (category === "ass") nbType = "hass";
          if (category === "paizuri" || category === "milf") nbType = "paizuri";
          if (category === "oppai") nbType = "boobs";
          
          const nbResp = await axios.get(`https://nekobot.xyz/api/image?type=${nbType}`, { timeout: 5000 });
          if (nbResp.data?.message) {
            imageUrl = nbResp.data.message;
          }
        } catch (err) {
          console.error("All NSFW providers failed.");
        }
      }

      if (!imageUrl) throw new Error("Could not fetch any NSFW image from all providers");

      const embed = new EmbedBuilder()
        .setTitle(`🔞 너, 진짜 변태인 거 아니야?! (${category})`)
        .setDescription(`**뒤를 조심해! 누가 보고 있을지도 모르니까! 콘콘!** <a:KemomimiDance:1048568057599119370>`)
        .setImage(imageUrl)
        .setFooter({ text: `Source: ${apiUsed} | 나츠미의 시크릿 갤러리` })
        .setTimestamp()
        .setColor("#FF0000");

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error("NSFW Final Error:", error.message);
      await interaction.editReply({ content: "**모든 데이터 기운이 끊겼어! (서버 응답 없음) 흥!**" });
    }
  },
};
