const mongoose = require("mongoose");

const BannedWordsSchema = new mongoose.Schema({
  word: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("BannedWords", BannedWordsSchema);
