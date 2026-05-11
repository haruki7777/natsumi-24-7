import mongoose from "mongoose";

const natsumiAnonIdentitySchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    anonIp: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

natsumiAnonIdentitySchema.index({ guildId: 1, userId: 1 }, { unique: true });

export default mongoose.models.NatsumiAnonIdentity || mongoose.model("NatsumiAnonIdentity", natsumiAnonIdentitySchema);
