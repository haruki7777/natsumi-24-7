import mongoose from "mongoose";

const natsumiTtsPreferenceSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    voiceId: { type: String, default: "Seoyeon" },
    voiceName: { type: String, default: "야옹이" },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

natsumiTtsPreferenceSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export default mongoose.models.NatsumiTtsPreference || mongoose.model("NatsumiTtsPreference", natsumiTtsPreferenceSchema);
