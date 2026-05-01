const {

  Client,

  SlashCommandBooleanOption,

  SlashCommandBuilder,

  ChatInputCommandInteraction,

  AttachmentBuilder,

} = require("discord.js");

const Canvacord = require("canvacord");

const { calculateXP } = require("../../events/levels");



const featuresDB = require("../../models/Features");

const levelsDB = require("../../models/LevelSystem");



module.exports = {

  data: new SlashCommandBuilder()

    .setName("랭크")

    .setDescription(

      "당신의 계급이나 다른 사람들의 계급을 보라냥! (레벨 시스템이 활성화되어야 한다냥)"

    )

    .addUserOption((option) =>

      option.setName("유저").setDescription("유저를 고르라냥")

    ),

  /**

   *

   * @param {ChatInputCommandInteraction} interaction

   * @param {Client} client

   */

  async execute(interaction, client) {
    await interaction.deferReply();

    const { options, guild, member } = interaction;



    const levelSystemCheck = await featuresDB.findOne({ GuildID: guild.id });

    if (levelSystemCheck) {

      const { LevelSystem } = levelSystemCheck;

      if (!LevelSystem.Enabled)

        return interaction.editReply({

          content: `미안하지만<@${guild.ownerId}>가 레벨시스템을 키지 않았다냥 🙁`,

          ephemeral: true,

        });



      const rankcard = new Canvacord.Rank().registerFonts([

        { path: "../../fonts/HSJiptokki-Round.ttf", name: "HSJiptokki Round" },

      ]);

      const user = options.getUser("유저");



      if (user) {

        let levelResult = await levelsDB.findOne({

          GuildID: guild.id,

          UserID: user.id,

        });



        if (levelResult && levelResult.xp) {

          rankcard


        .setAvatar(user.displayAvatarURL({ extension: "png" }))


            .setCurrentXP(parseInt(`${levelResult?.xp || "0"}`))

            .setLevel(parseInt(`${levelResult.level || "1"}`))

            .setProgressBar(`Orange`)

            .setRequiredXP(calculateXP(levelResult.level))

            .setOverlay("#000000", 1, false)

            .setUsername(`${user.username}`, color = "#1ABC9C")

            .setDiscriminator(`${user.discriminator}`, color ="#1ABC9C")

            .setBackground(

              "IMAGE",

              LevelSystem.Background ||

                "https://media.discordapp.net/attachments/1042125737353805934/1061316849968615485/F304A518-A461-41EC-8A82-26ED2B87D156.png"

            )

            .renderEmojis(true)

            .setLevelColor(`Orange`);

        } else {

          return interaction.reply({

            content: `${user}는 xp가 없다냥! 🙁`,

            ephemeral: true,

          });

        }

      } else {

        let levelResult = await levelsDB.findOne({

          GuildID: guild.id,

          UserID: member.user.id,

        });



        if (levelResult && levelResult.xp) {

          rankcard

            

            .setAvatar(member.user.displayAvatarURL({ extension: "png" }))

            .setCurrentXP(parseInt(`${levelResult.xp}`) || 0)

            .setLevel(parseInt(`${levelResult.level}` || 1))

            .setRequiredXP(calculateXP(levelResult.level))

            .setProgressBar(`Orange`)

            .setOverlay("#000000", 1, false)

            .setUsername(`${member.user.username}`, color ="#1ABC9C")

            .setDiscriminator(`${member.user.discriminator}`, color ="#1ABC9C")

            .setBackground(

              "IMAGE",

              LevelSystem.Background ||

                "https://media.discordapp.net/attachments/1042125737353805934/1061316849968615485/F304A518-A461-41EC-8A82-26ED2B87D156.png"

            )

            .renderEmojis(true)

            .setLevelColor(`Orange`);

        } else {

          return interaction.editReply({

            content: `너에게는 xp가 없다냥 🙁`,

            ephemeral: true,

          });

        }

      }



      const img = rankcard.build();
      

      const atta = new AttachmentBuilder(await img).setName("rank.png");

      interaction.editReply({ files: [atta] });

    } else {

      return interaction.editReply({

        content:  `미안하지만 <@${guild.ownerId}> 가 시스템을 키지 않았다냥! 🙁`,

        ephemeral: true,

      });

    }

  },

};