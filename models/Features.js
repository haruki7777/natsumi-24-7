import { model, Schema } from 'mongoose';

const FeaturesSchema = new Schema({
    GuildID: String,
    LevelSystem: {
        Enabled: {
            type: Boolean,
            default: false,
        },
        Background: {
            type: String,
            default: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=1000&auto=format&fit=crop"
        }
    }
});

FeaturesSchema.index({ GuildID: 1 }, { unique: true });

export default model("Features", FeaturesSchema)
