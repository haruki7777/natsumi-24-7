const { SlashCommandBuilder } = require("discord.js");
const fetch = require("node-fetch");

// Note: Values from original broken_fun/ÇÎÆþºô´õ.js
const pingpongApi = "Basic a2V5OjUxMTk0MDQ3NWQxZDY3MWVkNTBhYTYxOWZkYmIzMGQ2";
const pingpongUrl = "https://builder.pingpong.us/api/builder/638b6b6de4b04966c0ae5ec6/integration/v0.2/custom/natsumi_session";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("나츠미")
    .setDescription("나츠미랑 대화하자냥! (AI)")
    .addStringOption((option) =>
      option
        .setName("문장")
        .setDescription("하고 싶은 말을 입력해주라냥")
        .setRequired(true)
    ),
  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    const query = interaction.options.getString("문장");

    try {
      const response = await fetch(pingpongUrl, {
        method: "POST",
        headers: {
          "Authorization": pingpongApi,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          request: { query }
        }),
      });

      if (!response.ok) {
        throw new Error(`PingPong API returned ${response.status}`);
      }

      const data = await response.json();
      const reply = data.response.replies[0]?.text || "음... 뭐라고 해야 할지 모르겠다냥...";
      
      await interaction.editReply(reply);
    } catch (err) {
      console.error(err);
      await interaction.editReply({
        content: `**냐하앗... 대화 도중에 머리가 아파졌다냥! 🤕\n오류: ${err.message}**`,
      });
    }
  },
};
