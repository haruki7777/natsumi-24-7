import { model, Schema } from "mongoose";

export default model("GameInventory", new Schema({
  userId: { type: String, index: true },
  titles: [String],
  badges: [String],
  activeTitle: String,
}));
