import mongoose from "mongoose";

const BannedWordsSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("BannedWords", BannedWordsSchema);
