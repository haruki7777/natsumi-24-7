import { Schema, model } from "mongoose";

export default model(
  "verify",
  new Schema({
    guildId: String,
    channelId: String,
    roleId: String,
  })
);
