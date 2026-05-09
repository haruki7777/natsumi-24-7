import mongoose, { Schema, model } from "mongoose";

const warningSchema = new Schema(
  {
    guildID: { type: String, required: true, index: true },
    userID: { type: String, required: true, index: true },
    count: { type: Number, default: 0 },
    lastReason: { type: String, default: "사유 없음" },
    lastModeratorID: String,
  },
  { timestamps: true }
);

warningSchema.index({ guildID: 1, userID: 1 }, { unique: true });

export default mongoose.models.Warning || model("Warning", warningSchema);
