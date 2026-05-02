const { Schema, model } = require("mongoose");

module.exports = model(
  "ticket",
  new Schema({
    guildId: String,
    channelId: String,
    message: { type: String, default: "문의사항을 말씀해주라냥!" }
  })
);
