const { Schema, model } = require("mongoose");

module.exports = model(
  "Log",
  new Schema({
    guildId: String,
    channelId: String
  })
);