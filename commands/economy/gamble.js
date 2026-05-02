const min_winrate = 10; //도박 최소 확률을 입력해 주세요 (""안에 넣지 마시고 그냥 숫자로 적어주세요)
const max_winrate = 55; //도박 최대 확률을 입력해 주세요 (""안에 넣지 마시고 그냥 숫자로 적어주세요)

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const dobak_Schema = require("../../models/dobak");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("도박")
    .setDescription("도박을 한다냥!")
    .addIntegerOption((f) =>
      f
        .setName("금액")
        .setDescription("베팅하실 금액을 입력해 주라냥")
        .setMinValue(1)
        .setRequired(true)
    ),
  /**
   *
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const dobak_find = await dobak_Schema.findOne({
      userid: interaction.user.id,
    });
    if (!dobak_find) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${interaction.user.username}님! 도박 데이터가 존재하지 않다냥!\n\`/돈받기\` 명령어로 돈을 흭득한 후 다시 시도해라냥!!`
            )
            .setColor("Red")
            .setAuthor({
              name: `${interaction.user.tag}`,
              iconURL: `${interaction.user.displayAvatarURL({
                dynamic: true,
              })}`,
            }),
        ],
      });
    }
    if (dobak_find.money < 10000) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${interaction.user.username}님! 도박을 하려면 최소 **10,000원** 이상이 있어야 한다냥!\n\`/출석체크\`로 돈을 더 모아주라냥!`
            )
            .setColor("Red")
            .setAuthor({
              name: `${interaction.user.tag}`,
              iconURL: `${interaction.user.displayAvatarURL({
                dynamic: true,
              })}`,
            }),
        ],
      });
    }

    const bettingMoney = interaction.options.getInteger("금액");
    if (dobak_find.money < bettingMoney) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `${interaction.user.username}님! 보유중인 잔액이 부족하다냥 \`/돈받기\` 또는 \`/출석체크\` 명령어로 돈을 흭득한 후 다시 시도해라냥!`
            )
            .setColor("Red")
            .setAuthor({
              name: `${interaction.user.tag}`,
              iconURL: `${interaction.user.displayAvatarURL({
                dynamic: true,
              })}`,
            }),
        ],
      });
    }
    const random_number = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
    const winrate =
      Math.floor(Math.random() * (max_winrate - min_winrate + 1)) + min_winrate;
    if (winrate > random_number) {
      await dobak_Schema.updateOne(
        { userid: interaction.user.id },
        {
          money: dobak_find.money + bettingMoney,
        }
      );
      const embed = new EmbedBuilder()
        .setColor("Green")
        .setAuthor({
          name: `${interaction.user.tag}`,
          iconURL: `${interaction.user.displayAvatarURL({
            dynamic: true,
          })}`,
        })
        .setDescription(
          `\`${winrate}%\` 확률로 승리하여 \`${bettingMoney.toLocaleString(
            "ko-KR"
          )}\`원을 지급했다냥.`
        );
      interaction.editReply({ embeds: [embed] });
    } else {
      await dobak_Schema.updateOne(
        { userid: interaction.user.id },
        {
          money: dobak_find.money - bettingMoney,
        }
      );
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setAuthor({
          name: `${interaction.user.tag}`,
          iconURL: `${interaction.user.displayAvatarURL({
            dynamic: true,
          })}`,
        })
        .setDescription(
          `\`${
            100 - winrate
          }%\` 확률로 패배하여 \`${bettingMoney.toLocaleString(
            "ko-KR"
          )}\`원이 회수되었다냥 ㅋㅋㅋㅋ`
        );
      interaction.editReply({ embeds: [embed] });
    }
  },
};
