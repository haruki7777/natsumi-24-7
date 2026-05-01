//Commands/* 폴더에 넣어주세요
const { SlashCommandBuilder } = require("@discordjs/builders");
const request = require("request");

//참고 영상 : https://youtu.be/0NnyNtUX1Gw
let pinpongapi = "Basic a2V5OjUxMTk0MDQ3NWQxZDY3MWVkNTBhYTYxOWZkYmIzMGQ2"; //영상 참고
let pinpongurl = "https://builder.pingpong.us/api/builder/638b6b6de4b04966c0ae5ec6/integration/v0.2/custom/{sessionId}"; // 영상참고

module.exports = {
  data: new SlashCommandBuilder()
    .setName("나츠미")
    .setDescription("인공지능 핑퐁빌더가 대답을 해준다냥")
    .addStringOption((option) =>
      option
        .setName("문장")
        .setDescription("핑퐁빌더에게 해보고 싶은 말을 적어주라냥")
        .setRequired(true)
    ),
  /**
   * @param {import('discord.js').CommandInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply();
    let text = interaction.options.getString("문장");
    try {
      let dataString = `{request: {query: ${text}}}`;

      const headers = {
        Authorization: `${pinpongapi}`,
        "Content-Type": "application/json",
      };

      let options = {
        //url에 전송해서 api와 함꺠 전송
        url: `${pinpongurl}`,
        method: "POST",
        headers: headers,
        body: dataString,
      };
      function callback(error, response, body) {
        if (!error && response.statusCode == 200) {
          let msg = JSON.parse(body, null, 1).response.replies[0].text;
          interaction.editReply(msg);
        } else {
          console.log(error, response.statusCode);
        }
      }
      request(options, callback);
    } catch (err) {
      interaction.editReply({
        content: "대화중 오류가발생하였습니다\n 오류 : " + err,
      });
    }
  },
};
