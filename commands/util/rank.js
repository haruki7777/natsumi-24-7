const {
  SlashCommandBuilder,
  AttachmentBuilder,
} = require("discord.js");
const Canvacord = require("canvacord");
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

    const rankcard = new Canvacord.Rank()
      .setAvatar(targetUser.displayAvatarURL({ extension: "png" }))
      .setCurrentXP(levelData.xp || 0)
      .setLevel(levelData.level || 1)
      .setRequiredXP(calculateXP(levelData.level || 1))
      .setProgressBar("Orange")
      .setUsername(targetUser.username)
      .setDiscriminator(targetUser.discriminator !== "0" ? targetUser.discriminator : "0000")
      .setBackground("IMAGE", levelSystemCheck.LevelSystem.Background || "https://media.discordapp.net/attachments/1042125737353805934/1061316849968615485/F304A518-A461-41EC-8A82-26ED2B87D156.png")
      .renderEmojis(true)
      .setLevelColor("Orange");

    // Optional: Try to set custom font if it exists
    const fontPath = path.join(process.cwd(), "fonts", "HSJiptokki-Round.ttf");
    try {
        rankcard.registerFonts([{ path: fontPath, name: "HSJiptokki Round" }]);
    } catch (e) {
        // Fallback to default font
    }

    const img = await rankcard.build();
    const attachment = new AttachmentBuilder(img, { name: "rank.png" });
    await interaction.editReply({ files: [attachment] });
  },
};
