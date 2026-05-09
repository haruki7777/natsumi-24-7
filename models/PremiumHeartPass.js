import mongoose from "mongoose";

const premiumHeartPassSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    lastVerifiedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true, index: true },
    source: { type: String, default: "koreanbots" },
  },
  { timestamps: true }
);

export default mongoose.models.PremiumHeartPass || mongoose.model("PremiumHeartPass", premiumHeartPassSchema);
