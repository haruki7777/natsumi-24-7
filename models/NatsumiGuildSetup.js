import mongoose from "mongoose";

const natsumiGuildSetupSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    featureCategoryId: { type: String, default: null },
    voiceCategoryId: { type: String, default: null },
    aiChannelIds: { type: [String], default: [] },
    textChannelIds: { type: [String], default: [] },
    voiceChannelIds: { type: [String], default: [] },
    featureChannels: {
      aiChat: { type: String, default: null },
      aiImage: { type: String, default: null },
      emoji: { type: String, default: null },
      secret: { type: String, default: null },
      anonymous: { type: String, default: null },
      chat: { type: String, default: null },
      tts: { type: String, default: null },
      tempVoice: { type: String, default: null },
    },
    aiGlobalEnabled: { type: Boolean, default: false },
    setupBy: { type: String, default: null },
    setupAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.NatsumiGuildSetup || mongoose.model("NatsumiGuildSetup", natsumiGuildSetupSchema);
