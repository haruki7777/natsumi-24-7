export default {
    name: "dummy",
    async execute(interaction) {
        await interaction.reply({ content: "이것은 예시 버튼이다냥!", ephemeral: true });
    }
};
