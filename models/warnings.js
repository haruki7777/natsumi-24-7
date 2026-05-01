const { Schema, model } = require("mongoose");
module.exports = model(
  "경고",
  new Schema({
    guildID: String,
    userID: String,
    count: Number,
  })
);