import { Schema, model } from "mongoose";

export default model(
  "Log",
  new Schema({
    guildId: String,
    channelId: String
  })
);