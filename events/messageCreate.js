module.exports = {
    name: "messageCreate",
    once: false,
    execute(message) {
      if (message.content == "안녕 나츠미") {
        message.reply({ content: `**할로할로~ 제이름은 나츠미!! 귀엽고 깜직하면서도 여러분들을 유혹하는 여우랍니다💛**` });
      }
    },
  };