export default {
    name: "dummy",
    async execute(interaction) {
        await interaction.reply({ content: "**이건 그냥 예시 버튼이야! 콘콘! 별로 의미는 없다구!**", ephemeral: true });
    }
};
