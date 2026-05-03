import { readdirSync } from "fs";
import path from "path";
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("도움말")
    .setDescription("도움말을 보여준다냥"),

  async execute(interaction, client) {
    await interaction.deferReply();

    const command_folder_name = "commands";
    const select = new StringSelectMenuBuilder()
      .setCustomId("help_category")
      .setPlaceholder("카테고리를 선택해 주세요")
      .addOptions([
        {
          label: "메인",
          value: "main",
          description: "메인 화면으로 돌아갑니다.",
          emoji: "🏠",
        },
        {
          label: "소개",
          value: "about",
          description: "봇 소개를 확인합니다.",
          emoji: "📋",
        },
      ]);

    const embeds = {};
    const categories = readdirSync(path.join(process.cwd(), command_folder_name), { withFileTypes: true });

    for (const categoryEntry of categories) {
      if (!categoryEntry.isDirectory()) continue;
      const category = categoryEntry.name;
      if (category.startsWith("broken_") || category === "ContextMenu") continue;
      
      embeds[category] = new EmbedBuilder()
        .setThumbnail(client.user.displayAvatarURL())
        .setTitle(`📂 ${category} 카테고리`)
        .setColor("Orange")
        .setTimestamp();

      const files = readdirSync(path.join(process.cwd(), command_folder_name, category)).filter(file => file.endsWith(".js"));

      if (files.length > 0) {
        select.addOptions({
          value: category,
          label: category,
          description: `${category} 관련 명령어를 확인합니다.`,
          emoji: "📁",
        });

        // Use already loaded commands from client
        const categoryCommands = client.commands.filter(cmd => {
            // This is a bit heuristic, but since we know where they were loaded from
            // We can check if the file existed in that category
            return files.includes(cmd.data.name + ".js") || files.includes(cmd.data.name + ".ts");
        });

        categoryCommands.forEach(command => {
            embeds[category].addFields({
                name: `/${command.data.name}`,
                value: `${command.data.description || "설명 없음"}`,
                inline: true,
            });
        });
      }
    }

    const startTime = Math.floor(client.readyAt / 1000);
    embeds["main"] = new EmbedBuilder()
      .setTitle("🐱 나츠미 도움말")
      .setDescription("> 냐하핫! 나츠미 도움말 페이지다냥! \n> 봇 패치 및 공지사항은 서포트 서버에서 확인해주라냥.\n> 아래 메뉴를 열면 카테고리별 명령어를 볼 수 있다냥!")
      .setImage('https://media.discordapp.net/attachments/1034725786181193785/1054998382558584832/CFB8F7C5-4DA9-46CC-8B6F-348EE6A3906B.png')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "업타임", value: `<t:${startTime}:R>`, inline: true },
        { name: "지연 시간", value: `${client.ws.ping}ms`, inline: true },
        { name: "서버 수", value: `${client.guilds.cache.size} 서버`, inline: true }
      )
      .setColor("Yellow");

    embeds["about"] = new EmbedBuilder()
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setTitle(`⛩️ 봇 소개`)
      .setDescription("> 냐하핫! 나츠미는 계속 발전하고 있다냥! \n> **제작자: 하루키#3081** \n> 도움이 필요하면 서포트 서버로 와주라냥!")
      .setColor("Orange")
      .setImage('https://media.discordapp.net/attachments/1034725786181193785/1054998382558584832/CFB8F7C5-4DA9-46CC-8B6F-348EE6A3906B.png')
      .setTimestamp();

    const btn1 = new ButtonBuilder()
      .setLabel("봇 초대")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.com/api/oauth2/authorize?client_id=905355491708903485&permissions=8&scope=bot%20applications.commands");

    const btn2 = new ButtonBuilder()
      .setLabel("서포트 서버")
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/DzkPQSaV4F");

    const row = new ActionRowBuilder().addComponents(select);
    const btnRow = new ActionRowBuilder().addComponents(btn1, btn2);

    const msg = await interaction.editReply({
      components: [row, btnRow],
      embeds: [embeds["main"]],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (f) => f.user.id == interaction.user.id,
      time: 60000,
    });

    collector.on("collect", (i) => {
      if (i.customId === "help_category") {
        i.update({ embeds: [embeds[i.values[0]]] });
      }
    });
  },
};
