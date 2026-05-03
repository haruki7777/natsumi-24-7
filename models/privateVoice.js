
import { model, Schema } from "mongoose";

export default model(
  "개인음성채널",
  new Schema({
    guildId: String,
    categoryId: String,
    channelId: String,
    name: String,
  })
);
