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

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("서버정보")
    .setDescription("서버정보를 확인한다냥!"),
  async execute(interaction) { 
    await interaction.deferReply();
    const owner = await interaction.guild.fetchOwner();
    const MainEmbed = new EmbedBuilder()
      .setTitle(`${interaction.guild.name} 서버의 정보`)
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "서버 아이디", value: `**${interaction.guild.id}**`, inline: true },
        {
          name: "서버 주인",
          value: `**<@${owner.id}> (${owner.user.tag})**`,
          inline: true,
        },
        { name: "서버 인원", value: `**${interaction.guild.memberCount}명**`, inline: true },
        {
          name: "서버 부스트",
          value: `**${interaction.guild.premiumSubscriptionCount}번 (${interaction.guild.premiumTier}레벨)**`,
          inline: true,
        },
        {
          name: "서버 언어",
          value: `**${lang_trans[interaction.guild.preferredLocale] || interaction.guild.preferredLocale}**`,
          inline: true,
        },
        {
          name: "서버 보안",
          value: `**${ServerAuthLevel[interaction.guild.verificationLevel]}**`,
          inline: true,
        },
        {
          name: "서버 생성일",
          value: `**<t:${Math.round(interaction.guild.createdTimestamp / 1000)}:f>**`,
        }
      )
      .setColor("Orange");
    interaction.editReply({ embeds: [MainEmbed] });
  },
};
