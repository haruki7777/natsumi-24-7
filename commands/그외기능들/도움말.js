const command_folder_name = "Commands"; //커맨드 폴더 이름을 입력해 주세요 (대소문자 구분)

const { readdirSync } = require("fs");

const path = require("path");

const client = require("../../index");

const {

  SlashCommandBuilder,

  EmbedBuilder,

  ButtonBuilder,

  ButtonStyle,

  SelectMenuBuilder,

  ActionRowBuilder,

} = require("discord.js");



module.exports = {

  data: new SlashCommandBuilder()

    .setName("도움말")

    .setDescription("도움말을 보여준다냥"),

  async execute(interaction) {
    await interaction.deferReply();


    let embed = [];

    const select = new SelectMenuBuilder()

      .setCustomId("hmm")

      .setPlaceholder("카테고리를 선택해 주세요")

      .addOptions({

        label: "메인",

        value: "메인",

        emoji: "<a:1048568057599119370:1048568057599119370> ",

      })

      .addOptions({

        label: "소개",

        value: "소개",

        emoji: "<a:1048568057599119370:1048568057599119370> ",

      });

    const categorys = readdirSync(

      path.resolve(__dirname, `../../${command_folder_name}`)

    );

    for (let f = 0; f < categorys.length; f++) {

      embed[categorys[f]] = new EmbedBuilder()

        .setThumbnail(interaction.client.user.displayAvatarURL())

        .setTitle(`${categorys[f]} 명령어들`)

        .setColor("Orange")

        .setTimestamp();

      const files = readdirSync(

        path.resolve(__dirname, `../../${command_folder_name}/${categorys[f]}`)

      );

      select.addOptions({

        value: `${categorys[f]}`,

        label: `${categorys[f]}`,

        description: `${categorys[f]} 명령어들을 확인합니다.`,

        emoji: "<a:1048568057599119370:1048568057599119370>",

      });

      for (let i = 0; i < files.length; i++) {

        const command = require(path.resolve(

          __dirname,

          `../../${command_folder_name}/${categorys[f]}/${files[i]}`

        ));

        embed[categorys[f]].addFields({

          name: `${command.data.name}`,

          value: `${command.data.description || command.description}`,

          inline: true,

        });

      }

      const style = "R";

      const starttime =

        `<t:${Math.floor(client.readyAt / 1000)}` +

        (style ? `:${style}` : "") +

        ">";

      embed["메인"] = new EmbedBuilder()

        .setTitle("나츠미 도움말 페이지")

        .setDescription("> 나츠미 도움말 페이지입니다. \n> 봇 패치 및 공지사항은 \n> 서포트서버에서 확인해주세요.\n> 아래 메뉴를 열면 도움말 목록이 나옵니다.<a:2468_Human_Dance:1044205475622834186>")

        .setImage('https://media.discordapp.net/attachments/1034725786181193785/1054998382558584832/CFB8F7C5-4DA9-46CC-8B6F-348EE6A3906B.png')

        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))

        .addFields(

          { name: "업타임", value: `${starttime}` },

          { name: "핑", value: `${client.ws.ping}` },

          { name: "서버수", value: `${client.guilds.cache.size} 서버` }

        )

        .setColor("Yellow");

      embed["소개"] = new EmbedBuilder()

        .setThumbnail(

          interaction.client.user.displayAvatarURL({ dynamic: true })

        )

        .setTitle(`⛩️봇 소개⛩️`)

        .setDescription(

          "> 냐하핫! <a:Blonde_Neko_ThumbsUp:1038252691295572069> **나츠미는 발전중이야!!** \n> **나의 봇 주인은 하루키#3801 이야!**\n> **혹시 궁금하면 DM을 줘!!** \n> **후원도 부탁해!!** \n> **후원은 나츠미가** \n> **호스팅 유지비에 쓰여진다구!!** \n> **후원주소는 여기!!**\n https://toss.me/haruki7777 <a:Blonde_Neko_ThumbsUp:1038252691295572069> "

        )

        .setColor("Orange")

        .setImage('https://media.discordapp.net/attachments/1034725786181193785/1054998382558584832/CFB8F7C5-4DA9-46CC-8B6F-348EE6A3906B.png')

        .setTimestamp();

    }

    const btn1 = new ButtonBuilder()

      .setLabel("봇 초대하기")

      .setStyle(ButtonStyle.Link)

      .setEmoji("<:KemomimiDance:1048568057599119370>")

      .setURL("https://discord.com/api/oauth2/authorize?client_id=905355491708903485&permissions=4294443007&scope=bot%20applications.commands");

    const btn2 = new ButtonBuilder()

      .setLabel("서포트 서버")

      .setStyle(ButtonStyle.Link)

      .setEmoji("<:KemomimiDance:1048568057599119370>")

      .setURL("https://discord.gg/DzkPQSaV4F");

    const btn3 = new ButtonBuilder()

      .setLabel("한디리 놀러가기")

      .setStyle(ButtonStyle.Link)

      .setEmoji("<:KemomimiDance:1048568057599119370>")


.setURL("https://koreanbots.dev/bots/905355491708903485");

    const btn4 = new ButtonBuilder()

      .setLabel("봇 도움말 보러가기")

      .setStyle(ButtonStyle.Link)

      .setEmoji("<:KemomimiDance:1048568057599119370>")

.setURL("http://natsumi.fco.kr")

    const btn5 = new ButtonBuilder()

      .setLabel("하트 심어주기")

      .setStyle(ButtonStyle.Link)

      .setEmoji("<:KemomimiDance:1048568057599119370>")

.setURL("https://koreanbots.dev/bots/905355491708903485/vote")
    
    const row = new ActionRowBuilder().addComponents(select);

    const btnrow = new ActionRowBuilder().addComponents(btn1, btn2,btn3,btn4,btn5);

    const msg = await interaction.editReply({

      components: [row, btnrow],

      embeds: [embed["메인"]],

    });

    const collector = msg.createMessageComponentCollector({

      filter: (f) => f.user.id == interaction.user.id,

    });

    collector.on("collect", (i) => {


      i.update({ embeds: [embed[i.values[0]]] });

    });

  },

};

