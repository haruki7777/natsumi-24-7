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
import { getTranslation } from "../../utils/i18n.js";

export default {
  data: new SlashCommandBuilder()
    .setName("도움말")
    .setDescription("도움말을 보여준다냥")
    .setNameLocalizations({
        "en-US": "help",
        "ja": "ヘルプ"
    })
    .setDescriptionLocalizations({
        "en-US": "Show help commands",
        "ja": "ヘルプを表示します"
    }),

  async execute(interaction, client) {
    await interaction.deferReply();
    const locale = interaction.locale;

    const command_folder_name = "commands";
    const select = new StringSelectMenuBuilder()
      .setCustomId("help_category")
      .setPlaceholder(getTranslation(locale, "help.placeholder"))
      .addOptions([
        {
          label: getTranslation(locale, "help.main"),
          value: "main",
          description: "메인 화면으로 돌아갑니다.",
          emoji: "🏠",
        },
        {
          label: getTranslation(locale, "help.about"),
          value: "about",
          description: "봇 소개를 확인합니다.",
          emoji: "📋",
        },
      ]);

    const embeds = {};
    const categoriesDir = readdirSync(path.join(process.cwd(), command_folder_name), { withFileTypes: true });

    const categoryLabels = {
      "general": "기본 명령어",
      "fun": "재미/놀이",
      "economy": "도박/경제",
      "util": "유틸리티",
      "mod": "관리자",
      "NSFW": "NSFW (🔞)",
      "SFW": "SFW (애니)",
      "ticket": "티켓 시스템"
    };

    const categoryEmojis = {
      "general": "✨",
      "fun": "🎊",
      "economy": "💰",
      "util": "⚙️",
      "mod": "🛡️",
      "NSFW": "🔞",
      "SFW": "🌸",
      "ticket": "🎫"
    };

    for (const categoryEntry of categoriesDir) {
      if (!categoryEntry.isDirectory()) continue;
      const category = categoryEntry.name;
      if (category.startsWith("broken_") || category === "ContextMenu") continue;
      
      const label = categoryLabels[category] || category;
      const emoji = categoryEmojis[category] || "📁";

      embeds[category] = new EmbedBuilder()
        .setThumbnail(client.user.displayAvatarURL())
        .setTitle(`${emoji} ${label}`)
        .setColor("Orange")
        .setTimestamp();

      const categoryCommands = client.commands.filter(cmd => cmd.category === category);

      if (categoryCommands.size > 0) {
        select.addOptions({
          value: category,
          label: label,
          description: `${label} 관련 명령어를 확인합니다.`,
          emoji: emoji,
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
      .setTitle(getTranslation(locale, "help.title"))
      .setDescription(getTranslation(locale, "help.desc"))
      .setImage('https://media.discordapp.net/attachments/1034725786181193785/1054998382558584832/CFB8F7C5-4DA9-46CC-8B6F-348EE6A3906B.png')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: getTranslation(locale, "help.uptime"), value: `<t:${startTime}:R>`, inline: true },
        { name: getTranslation(locale, "help.latency"), value: `${client.ws.ping}ms`, inline: true },
        { name: getTranslation(locale, "help.servers"), value: `${client.guilds.cache.size}`, inline: true }
      )
      .setColor("Yellow");

    embeds["about"] = new EmbedBuilder()
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setTitle(`⛩️ ${getTranslation(locale, "help.about")}`)
      .setDescription("> 냐하핫! 나츠미는 계속 발전하고 있다냥! \n> **Developer: Haruki** \n> If you need help, come to the support server, nya!")
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
