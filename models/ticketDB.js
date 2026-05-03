import { Schema, model } from "mongoose";

export default model(
  "ticket",
  new Schema({
    guildId: String,
    channelId: String,
    message: { type: String, default: "문의사항을 말씀해주라냥!" }
  })
);
