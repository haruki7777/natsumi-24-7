import mongoose from "mongoose";

const natsumiGuildSetupSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    featureCategoryId: { type: String, default: null },
    voiceCategoryId: { type: String, default: null },
    aiChannelIds: { type: [String], default: [] },
    textChannelIds: { type: [String], default: [] },
    voiceChannelIds: { type: [String], default: [] },
    aiGlobalEnabled: { type: Boolean, default: false },
    setupBy: { type: String, default: null },
    setupAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.NatsumiGuildSetup || mongoose.model("NatsumiGuildSetup", natsumiGuildSetupSchema);
