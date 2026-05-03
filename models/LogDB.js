import { Schema, model } from "mongoose";

export default model(
  "log",
  new Schema({
    guildId: String,
    channelId: String,
  })
);
