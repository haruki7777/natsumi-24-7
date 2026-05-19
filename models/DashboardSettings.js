import { model, Schema } from "mongoose";

const welcomeTemplateSchema = new Schema({
  name: String,
  message: String,
}, { _id: false });

const ttsSchema = new Schema({
  enabled: { type: Boolean, default: false },
  categoryId: String,
  textChannelId: String,
  voiceChannelId: String,
  voice: String,
}, { _id: false });

const dashboardSettingsSchema = new Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  disabledCommands: { type: [String], default: [] },
  features: {
    welcome: { type: Boolean, default: false },
    notice: { type: Boolean, default: true },
    ticket: { type: Boolean, default: true },
    tts: { type: Boolean, default: false },
    emojiUpscale: { type: Boolean, default: false },
  },
  welcome: {
    enabled: { type: Boolean, default: false },
    channelId: String,
    leaveChannelId: String,
    cleanupOnLeave: { type: Boolean, default: true },
    message: { type: String, default: "어서 와, {user.mention}! {server.name}에 온 걸 환영해." },
    aiPrompt: { type: String, default: "" },
    templates: { type: [welcomeTemplateSchema], default: [] },
    lastWelcomeMessages: { type: Map, of: String, default: {} },
  },
  notice: {
    enabled: { type: Boolean, default: true },
    channelId: String,
  },
  tts: { type: ttsSchema, default: () => ({}) },
  emojiUpscale: {
    enabled: { type: Boolean, default: false },
    channelId: String,
    webhookName: { type: String, default: "Natsumi Emoji Upscaler" },
  },
}, { timestamps: true });

export default model("DashboardSettings", dashboardSettingsSchema);
