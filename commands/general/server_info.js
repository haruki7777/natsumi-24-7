let lang_trans = {
  da: "덴마크",
  de: "독일",
  "en-GB": "영국",
  "en-US": "미국",
  "es-ES": "스페인",
  fr: "프랑스",
  hr: "크로아티아",
  it: "이탈리아",
  lt: "리투아니아",
  hu: "헝가리",
  nl: "네덜란드",
  no: "노르웨이",
  pl: "폴란드",
  "pt-BR": "브라질",
  fi: "핀란드",
  "sv-SE": "스웨덴",
  vi: "베트남",
  tr: "터키",
  cs: "체코",
  el: "그리스",
  bg: "불가리아",
  ru: "러시아",
  uk: "우크라이나",
  hi: "힌디",
  th: "태국",
  "zh-CN": "중국",
  ja: "일본",
  "zh-TW": "중국 대만",
  ko: "한국",
};

let AdminAuthLevel = {
  0: "비활성화",
  1: "활성화",
};

let ServerAuthLevel = {
  0: "없음 (제한 없음)",
  1: "낮음",
  2: "중간",
  3: "높음",
  4: "매우 높음",
};

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("서버정보")
    .setDescription("이 숲에 대해 알고 싶어? (흥, 별로 대단한 곳도 아니구먼!)"),
  async execute(interaction) { 
    await interaction.deferReply();
    const owner = await interaction.guild.fetchOwner();
    const MainEmbed = new EmbedBuilder()
      .setTitle(`🦊 ${interaction.guild.name} 숲의 기록`)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "🏮 숲의 고유 번호", value: `\`${interaction.guild.id}\``, inline: true },
        {
          name: "👑 숲의 지배자",
          value: `<@${owner.id}> \n(${owner.user.tag})`,
          inline: true,
        },
        { name: "👥 모여있는 인간들", value: `**${interaction.guild.memberCount}** 명`, inline: true },
        {
          name: "💎 숲의 영력 (부스트)",
          value: `**${interaction.guild.premiumSubscriptionCount}** 회 \n(Lv. **${interaction.guild.premiumTier}**)`,
          inline: true,
        },
        {
          name: "🗣️ 주 사용 언어",
          value: `**${lang_trans[interaction.guild.preferredLocale] || interaction.guild.preferredLocale}**`,
          inline: true,
        },
        {
          name: "🛡️ 결계 강도 (보안)",
          value: `**${ServerAuthLevel[interaction.guild.verificationLevel]}**`,
          inline: true,
        },
        {
          name: "📅 숲이 생겨난 날",
          value: `<t:${Math.round(interaction.guild.createdTimestamp / 1000)}:f>`,
        }
      )
      .setColor("#FF7F50")
      .setFooter({ text: "이런 정보를 알아서 뭐 하게? 바보!" });
    interaction.editReply({ embeds: [MainEmbed] });
  },
};
