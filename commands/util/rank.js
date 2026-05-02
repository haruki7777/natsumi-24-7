const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { calculateXP } = require("../../events/levels");
const featuresDB = require("../../models/Features");
const levelsDB = require("../../models/LevelSystem");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("랭크")
    .setDescription("자신의 레벨이나 다른 사람의 레벨을 확인한다냥!")
    .addUserOption((option) =>
      option.setName("유저").setDescription("정보를 확인할 유저를 선택해주라냥")
    ),

  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const { options, guild, member } = interaction;
    const targetUser = options.getUser("유저") || member.user;

    const levelSystemCheck = await featuresDB.findOne({ GuildID: guild.id });
    if (!levelSystemCheck || !levelSystemCheck.LevelSystem?.Enabled) {
        return interaction.editReply({
          content: `미안하지만 이 서버는 레벨 시스템이 활성화되어 있지 않다냥! 🙁`,
        });
    }

    const levelData = await levelsDB.findOne({
      GuildID: guild.id,
      UserID: targetUser.id,
    });

    if (!levelData || !levelData.xp) {
      return interaction.editReply({
        content: targetUser.id === member.id ? "너는 아직 XP가 없다냥! 활동을 시작해보라냥!" : `${targetUser.username}님은 아직 XP가 없다냥!`,
      });
    }

    const xpToNextLevel = calculateXP(levelData.level || 1);
    const progress = Math.floor(((levelData.xp || 0) / xpToNextLevel) * 100);

    const embed = {
      title: `${targetUser.username}님의 랭크 정보`,
      description: `레벨: **${levelData.level || 1}**\nXP: **${levelData.xp || 0} / ${xpToNextLevel}** (${progress}%)`,
      color: 0xffa500,
      thumbnail: { url: targetUser.displayAvatarURL() }
    };

    await interaction.editReply({ embeds: [embed] });
  },
};
