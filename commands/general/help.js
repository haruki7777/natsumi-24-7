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
      "general": "✨ 기본 명령 (콘콘!)",
      "fun": "🎊 유희와 장난",
      "economy": "💰 내기랑 주머니",
      "util": "⚙️ 도구함",
      "mod": "🛡️ 관리의 권능",
      "NSFW": "🔞 은밀한 곳",
      "SFW": "🌸 애니매이션 숲",
      "ticket": "🎫 소통의 부적"
    };

    const categoryEmojis = {
      "general": "🦊",
      "fun": "👻",
      "economy": "💹",
      "util": "🔧",
      "mod": "⚒️",
      "NSFW": "🌚",
      "SFW": "🎐",
      "ticket": "📜"
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
        .setDescription(`흥! 이 카테고리가 보고 싶었던 거야? \n특별히 보여주는 거니까 감사하게 생각하라구! ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`)
        .setColor("#FF7F50")
        .setTimestamp();

      const categoryCommands = client.commands.filter(cmd => cmd.category === category);

      if (categoryCommands.size > 0) {
        select.addOptions({
          value: category,
          label: label,
          description: `${label} 관련 명령어를 나열해줄게!`,
          emoji: emoji,
        });

        categoryCommands.forEach(command => {
            embeds[category].addFields({
                name: `/${command.data.name}`,
                value: `> ${command.data.description || "설명 불가"}`,
                inline: true,
            });
        });
      }
    }

    const startTime = Math.floor(client.readyAt / 1000);
    embeds["main"] = new EmbedBuilder()
      .setTitle("🦊 나츠미의 도서관에 온 걸 환영해!")
      .setDescription(`콘콘~! 네가 뭘 모르는 것 같아서 내가 친절히(흥!) 설명해주러 왔어.\n아래 메뉴에서 보고 싶은 카테고리를 골라봐!\n**별로 널 위해서 준비한 건 아니니까 착각하지 마!** ♥(⸝⸝⸝ᵒ̴̶̷̥́ ᵕ ก̀⸝⸝⸝)ෆ`)
      .setImage('https://media.discordapp.net/attachments/1034725786181193785/1054998382558584832/CFB8F7C5-4DA9-46CC-8B6F-348EE6A3906B.png')
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "🍃 깨어난 지", value: `<t:${startTime}:R>`, inline: true },
        { name: "📡 반응 속도", value: `${client.ws.ping}ms`, inline: true },
        { name: "🏮 감시 중인 서버", value: `${client.guilds.cache.size}개`, inline: true }
      )
      .setColor("#FF7F50");

    embeds["about"] = new EmbedBuilder()
      .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
      .setTitle(`🦊 나츠미는 누구야?`)
      .setDescription("> 콘콘! 나는 평범한 여고생...이 아니라, 여우 령이 깃든 특별한 존재라구! \n> **제작자: Haruki** \n> 도움이 필요하면 서포트 서버로 오든가! (별로 기다리는 건 아냐!)")
      .setColor("#FF7F50")
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
