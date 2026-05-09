import mongoose, { Schema, model } from "mongoose";

const warnSettingsSchema = new Schema(
  {
    guildID: { type: String, required: true, unique: true, index: true },
    logChannelID: String,
    autoKickThreshold: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.WarnSettings || model("WarnSettings", warnSettingsSchema);
