//models 폴더에 넣어주세요

const { model, Schema } = require("mongoose");

module.exports = model(
  "tts",
  new Schema({
    guildid: String,
    channelid: String,
  })
);
