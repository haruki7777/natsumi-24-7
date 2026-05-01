const { Schema, model } = require("mongoose");

module.exports = model(
  "log",
  new Schema({
    guildId: String,
    channelId: String,
  })
);
