const mongoose = require("mongoose");

const ProcessedMessageSchema = new mongoose.Schema({
    messageId: { type: String, required: true, unique: true },
    processedAt: { type: Date, default: Date.now, expires: 600 } // Auto-delete after 10 mins
});

module.exports = mongoose.model("ProcessedMessage", ProcessedMessageSchema);
