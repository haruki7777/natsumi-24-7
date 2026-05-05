import { model, Schema } from 'mongoose';

const LevelSystemSchema = new Schema({
    GuildID: String,
    UserID: String,
    xp: {
        type: Number,
        default: 0,
    },
    level: {
        type: Number,
        default: 1,
    },
});

LevelSystemSchema.index({ GuildID: 1, UserID: 1 }, { unique: true });
LevelSystemSchema.index({ GuildID: 1, level: -1, xp: -1 });

export default model("LevelSystem", LevelSystemSchema)
