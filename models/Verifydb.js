const { Schema, model } = require("mongoose");

module.exports = model(
  "verify",
  new Schema({
    guildId: String,
    channelId: String,
    roleId: String,
  })
);
