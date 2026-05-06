import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("핑")
    .setDescription("봇의 핑을 확인한다냥!"),
  /**
   * @param {import("discord.js").ChatInputCommandInteraction} interaction
   */
  async execute(interaction, client) {
    if (interaction.replied || interaction.deferred) return;
    
    try {
      await interaction.deferReply();
    } catch (e) {
      console.error("[PingError] Failed to defer:", e.message);
      return;
    }
    
    const os = await import("os");
    const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(1);
    const freeMem = (os.freemem() / (1024 ** 3)).toFixed(1);
    const usedMem = (totalMem - freeMem).toFixed(1);
    const memPercent = ((usedMem / totalMem) * 100).toFixed(1);

    const cpuModel = os.cpus()[0]?.model || "알 수 없음";
    const cpuCount = os.cpus().length;

    const gatewayPing = client.ws.ping;
    const gatewayStatus = gatewayPing < 150 ? "🟢" : (gatewayPing < 300 ? "🟠" : "🔴");
    const apiLatency = Date.now() - interaction.createdTimestamp;
    const apiStatus = apiLatency < 300 ? "🟢" : (apiLatency < 600 ? "🟠" : "🔴");
    const uptime = Math.round(client.readyTimestamp / 1000);

    const embedColor = gatewayPing < 150 ? "#57F287" : (gatewayPing < 300 ? "#FEE75C" : "#ED4245");

    const embed = new EmbedBuilder()
      .setTitle("🦊 나츠미의 여우령 시스템 점검")
      .setDescription(`콘콘~! 네가 궁금해 죽으려고 하길래 특별히 보여주는 거야. \n여우의 눈은 속일 수 없다는 걸 명심해! \n**감동받아서 나한테 매달리지나 마!** ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`)
      .setColor("#FF8C00") 
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: "🏮 핵심 데이터 (Core)", value: `\`\`\`yml\n이름: ${client.user.username}\n버전: v2.3.2 (Vulpine Core)\n상태: 매우 쌩쌩함 (최고조)\`\`\``, inline: false },
        { name: "\u200B", value: "\u200B", inline: false },
        { name: "🍃 실행 환경", value: `**운영체제:** ${os.type()}\n**업타임:** <t:${uptime}:R>`, inline: true },
        { name: "⚙️ 하드웨어", value: `**메모리:** ${usedMem}G / ${totalMem}G\n**부하량:** ${memPercent}%`, inline: true },
        { name: "\u200B", value: "\u200B", inline: false },
        { name: "📡 통신 상태", value: `**게이트웨이:** ${gatewayStatus} (${gatewayPing}ms)\n**응답 속도:** ${apiStatus} (${apiLatency}ms)`, inline: true },
        { name: "🛰️ 네트워크", value: `**상태:** ${gatewayPing < 150 ? "완전 쾌적" : (gatewayPing < 300 ? "조금 느림" : "연결 불안")}\n**REST:** Stable`, inline: true }
      )
      .setFooter({ text: "나츠미는 항상 너를... 아니, 서버를 감시하고 있어! 🦊" })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
