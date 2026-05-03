import { model, Schema } from 'mongoose';

export default model("LevelSystem", new Schema({
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
}))