import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("스티커스틸")
    .setDescription("마음에 드는 스티커를 내가 가져와 줄게! 콘콘!")
    .addStringOption((option) =>
      option
        .setName("이름")
        .setDescription("새로 지어줄 이름은 뭐야?")
        .setRequired(false)
    ),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const newName = interaction.options.getString("이름");
    
    await interaction.editReply({ content: `**스틸할 스틱커를 이 채널에 하나만 보내봐! (60초 줄게!) 콘콘!**` });
    
    const filter = (m) => m.author.id === interaction.user.id && m.stickers.size > 0;
    const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });

    if (collected.size === 0) {
      return interaction.editReply({ content: "**흥! 기다리다 지쳤어! 바보야! 다음에 다시 오든가!**" });
    }

    const message = collected.first();
    const sticker = message.stickers.first();

    try {
      const createdSticker = await interaction.guild.stickers.create({
        file: sticker.url,
        name: newName || sticker.name,
        description: sticker.description || "나츠미가 가져온 멋진 스티커라구!",
        reason: `${interaction.user.tag} 유저가 스틸 요청함`
      });

      await interaction.editReply({ content: `**성공적으로 스티커 [${createdSticker.name}]를 이 숲에 박제했어! 만족스러워?**` });
      await interaction.channel.send({ stickers: [createdSticker] });
      
      // Cleanup the user's message if possible
      if (message.deletable) await message.delete().catch(() => {});
      
    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: "**뭐야! 오류가 났잖아! 숲의 영력이 부족한 건가? 흥!**" });
    }
  },
};
