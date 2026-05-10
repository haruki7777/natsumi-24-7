import mongoose from "mongoose";

const welcomeSettingsSchema = new mongoose.Schema(
  {
    guildID: { type: String, required: true, unique: true, index: true },
    channelID: { type: String, required: true },
    message: {
      type: String,
      default: "{user}님, {server}에 온 걸 환영해요!",
      maxlength: 180,
    },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.WelcomeSettings || mongoose.model("WelcomeSettings", welcomeSettingsSchema);
