
const { SlashCommandBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require("discord.js");


module.exports = {
    data: new SlashCommandBuilder()
    .setName("문의")
    .setDescription("나츠미 봇에대해 문의할사항 있으면 써주라냥"),
    /**
    *
    * @parm {import("discord.js").ChatInputCommandInteraction} interaction
    */
    async execute(interaction) {
        await interaction.deferReply();
        const modal = new ModalBuilder().setCustomId("inquiry").setTitle("문의서");

        const title = new ActionRowBuilder({
            components: [
                new TextInputBuilder()
                .setCustomId("title")
                .setLabel("이름")
                .setStyle(TextInputStyle.Short),
            ],
        });

        const ds = new ActionRowBuilder({
            components: [
                new TextInputBuilder()
                .setCustomId("ds")
                .setLabel("할말")
                .setStyle(TextInputStyle.Paragraph),
            ],
        });

        modal.addComponents(title,ds);

        await interaction.showModal(modal);

        const collector = await interaction.awaitModalSubmit({time:10*60*1000});

        if(collector){
            const title_value = collector.fields.fields.get("title")?.value;
            const ds_value = collector.fields.fields.get("ds")?.value;

            const embed = new EmbedBuilder()
            .setTitle(`**문의서 도착!! (${interaction.user.tag})**`)
            .setDescription(`**이름 : ${title_value}\n\n 할말: ${ds_value}**`)
            .setFooter({ text: `유저아이디 : ${interaction.user.id}` })
            .setColor("Green")
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic:true }));

            const developer_channel = interaction.client.channels.cache.get(
                "1072349046859108402"
            );

            developer_channel.send({ embeds: [embed] });

            collector.reply({
                ephemeral: true,
                content: `**자기소개가 전송되었어요!!**`,
            })
        }
    },
};