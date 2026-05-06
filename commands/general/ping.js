import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("핑")
    .setDescription("나츠미가 얼마나 빠르게 반응할 수 있는지 보여줄게! 콘콘!"),
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
        { name: "🏮 봇 정보", value: `\`\`\`yml\n봇이름: ${client.user.username}\n봇버전: v2.3.2 (Vulpine Core)\n상태: 최고조\`\`\``, inline: false },
        { name: "🍃 OS 정보", value: `\`\`\`yml\n운영체제: ${os.type()}\n아키텍처: ${os.arch()}\n업타임: 깨어있는 중\`\`\``, inline: true },
        { name: "⚙️ 하드웨어 정보", value: `\`\`\`yml\n메모리: ${usedMem}G / ${totalMem}G\n사용률: ${memPercent}%\nCPU: ${cpuCount} Cores\`\`\``, inline: true },
        { name: "📡 통신 및 네트워크", value: `\`\`\`yml\n게이트웨이: ${gatewayPing}ms (${gatewayStatus})\n응답속도: ${apiLatency}ms (${apiStatus})\n통신상태: ${gatewayPing < 150 ? "완전양호" : "불안정"}\`\`\``, inline: false }
      )
      .setFooter({ text: "나츠미는 항상 너를... 아니, 서버를 감시하고 있어! 🦊" })
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
