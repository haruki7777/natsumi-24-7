const {
  SlashCommandBuilder,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { Captcha } = require("captcha-canvas");
const db = require("../../models/Verifydb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("인증")
    .setDescription("인증을 진행한다냥"),
  ephemeral: true,
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply()
    const db_find = await db.findOne({ guildId: interaction.guildId });
    if (!db_find) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setDescription(
              ":error: 인증설정이 되어있지 않다냥. `/인증설정` 명령어로 인증설정을 완료하신 후 다시 시도하라냥."
            ),
        ],
      });
    } else {
      const captcha = new Captcha();
      captcha.async = false;
      captcha.addDecoy();
      captcha.drawTrace();
      captcha.drawCaptcha();

      const file = new AttachmentBuilder(await captcha.png, {
        name: "captcha.png",
      });

      const Embed = new EmbedBuilder()
        .setTitle("인증")
        .setDescription("아래 초록색 코드만 입력하여 인증을 진행하라냥")
        .setColor("Orange")
        .setImage("attachment://captcha.png");

      await interaction.editReply({
        embeds: [Embed],
        files: [file],
      });

      const collector = interaction.channel.createMessageCollector({
        time: 30000,
      });

      collector.on("collect", (m) => {
        if (m.author.id !== interaction.user.id) return;
        if (m.content !== captcha.text) {
          return m.channel
            .send({
              embeds: [
                new EmbedBuilder()
                  .setDescription("올바르지 않은 캡챠키이다냥")
                  .setColor("Red"),
              ],
            })
            .then((msg) => {
              setTimeout(() => {
                msg.delete();
              }, 1000);
            });
        } else {
          collector.stop();
          m.member.roles.add(db_find.roleId);
          interaction.editReply({
            content: `**인증이 완료되었다냥**`,
            embeds: [],
            files: [],
          });
          setTimeout(() => {
            interaction.deleteReply();
          }, 5000);
        }
        m.delete();
      });
    }
  },
};