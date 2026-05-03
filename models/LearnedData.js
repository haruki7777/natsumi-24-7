import mongoose from "mongoose";

const LearnedDataSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  user_id: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// For keyword searching if needed
LearnedDataSchema.index({ question: "text" });

export default mongoose.model("LearnedData", LearnedDataSchema);
