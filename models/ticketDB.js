import { Schema, model } from "mongoose";

export default model(
  "ticket",
  new Schema({
    guildId: String,
    channelId: String,
    message: { type: String, default: "용건이 뭐야? 빨리 말해!" }
  })
);
