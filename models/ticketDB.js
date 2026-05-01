const { Schema, model } = require("mongoose");

module.exports = model(
  "ticket",
  new Schema({
    guildId: String,
    channelId: String,
  })
);
