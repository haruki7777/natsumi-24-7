import { Schema, model } from "mongoose";
export default model(
  "경고",
  new Schema({
    guildID: String,
    userID: String,
    count: Number,
  })
);