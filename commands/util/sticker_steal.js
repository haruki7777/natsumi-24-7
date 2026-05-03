import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("스티커스틸")
    .setDescription("스티커를 내 서버로 가져온다냥!")
    .addStringOption((option) =>
      option
        .setName("이름")
        .setDescription("새로 만들 스티커의 이름을 입력하라냥")
        .setRequired(false)
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const newName = interaction.options.getString("이름");
    
    await interaction.editReply({ content: `**스틸할 스티커를 이 채널에 하나만 보내주라냥! (60초 내로)**` });
    
    const filter = (m) => m.author.id === interaction.user.id && m.stickers.size > 0;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });

    if (collected.size === 0) {
      return interaction.editReply({ content: "**시간이 초과되었다냥! 다시 시도해주라냥.**" });
    }

    const message = collected.first();
    const sticker = message.stickers.first();

    try {
      const createdSticker = await interaction.guild.stickers.create({
        file: sticker.url,
        name: newName || sticker.name,
        description: sticker.description || "나츠미가 스틸해온 스티커다냥",
        reason: `${interaction.user.tag} 유저가 스틸 요청함`
      });

      await interaction.editReply({ content: `**성공적으로 스티커 [${createdSticker.name}]를 서버에 추가했다냥!**` });
      await interaction.channel.send({ stickers: [createdSticker] });
      
      // Cleanup the user's message if possible
      if (message.deletable) await message.delete().catch(() => {});
      
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "**스티커를 추가하는 도중에 오류가 발생했다냥! (공간 부족이나 권한 문제일 수 있다냥)**" });
    }
  },
};
