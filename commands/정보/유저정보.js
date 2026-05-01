// 주의 사항 : index.js - client intents에 "GatewayIntentBits.GuildPresences" 인텐트가 포함되어 있지 않다면 활동 상세정보 명령어가 작동하지 않을 수 있습니다

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  
} = require("discord.js");

let UserStatus = {
  online: "온라인",
  idle: "자리비움",
  dnd: "다른 용무중",
  offline: "오프라인",
};

let BotCheck = {
  false: "사람 계정",
  true: "봇 계정",
};

let ActivitiesType = {
  0: "하는 중",
  1: "방송 중",
  2: "듣는 중",
  3: "시청 중",
  4: "커스텀",
  5: "참가 중",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("유저정보")
    .setDescription("유저정보를 확인합니다.")
    .addUserOption((op) =>
      op
        .setName("유저")
        .setDescription("정보를 조회할 유저를 선택하세요.")
        .setRequired(false)
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getMember("유저") || interaction.member;
    const MainEmbed = new EmbedBuilder()
      .setTitle("유저 정보")
      .setColor("Random")
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "유저", value: `**${user} (${user.user.tag})**` },
        { name: "아이디", value: `**${user.id}**` },
        { name: "계정", value: `**${BotCheck[user.user.bot]}**` },
        {
          name: "상태",
          value: `**${UserStatus[user.presence?.status] || "오프라인"}**`,
        },
        {
          name: "활동",
          value: `**${
            user.presence?.activities.length > 0
              ? `${user.presence?.activities} ${
                  ActivitiesType[user.presence?.activities[0]?.type]
                }`
              : "활동중이 아닙니다."
          }**`,
        },
        { name: "최상단 역할", value: `**<@&${user.roles.highest.id}>**` },
        {
          name: "계정 생성일",
          value: `**<t:${Math.round(
            user.user.createdTimestamp / 1000
          )}:f> (<t:${Math.round(user.user.createdTimestamp / 1000)}:R>)**`,
        },
        {
          name: "서버 입장일",
          value: `**<t:${Math.round(
            user.joinedTimestamp / 1000
          )}:f> (<t:${Math.round(user.joinedTimestamp / 1000)}:R>)**`,
        },
        {
          name: "부스트 여부",
          value: user.premiumSinceTimestamp
            ? `**<t:${Math.round(
                user.premiumSinceTimestamp / 1000
              )}:f> (<t:${Math.round(user.premiumSinceTimestamp / 1000)}:R>)**`
            : "❌",
        }
      );
    if (
      !user.presence?.activities.length ||
      user.presence?.activities.length == 0
    ) {
      interaction.editReply({
        embeds: [MainEmbed],
      });
      return;
    }
    const DetailActivities = new ButtonBuilder()
      .setCustomId(`check`)
      .setLabel("활동 상세정보")
      .setStyle(ButtonStyle.Primary);

    const msg = await interaction.editReply({
      embeds: [MainEmbed],
      components: [new ActionRowBuilder().addComponents(DetailActivities)],
    });

    const collector = msg.createMessageComponentCollector({
      time: 60 * 10000,
    });

    collector.on("collect", async (i) => {
      if (!i.isButton()) return;
      const CheckEmbed = new EmbedBuilder()
        .setTitle("활동 상세정보")
        .addFields(
          {
            name: "이름",
            value: `**${user.presence?.activities[0].name || "❌"}**`,
          },
          {
            name: "타입",
            value: `**${
              ActivitiesType[user.presence?.activities[0].type] || "❌"
            }**`,
          },
          {
            name: "링크",
            value: `**${user.presence?.activities[0].url || "❌"}**`,
          },
          {
            name: "세부",
            value: `**${user.presence?.activities[0].details || "❌"}**`,
          },
          {
            name: "상태",
            value: `**${user.presence?.activities[0].state || "❌"}**`,
          },
          {
            name: "파티",
            value: `**${user.presence?.activities[0].party || "❌"}**`,
          }
        )
        .setColor("Random");
      i.reply({ embeds: [CheckEmbed], ephemeral: true });
    });
  },
};