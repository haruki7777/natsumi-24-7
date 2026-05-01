module.exports = {
    name: "verify",
    async execute(interaction) {
      ({ ephemeral: true });
      interaction.client.commands.get("인증").execute(interaction);
    },
  };
  