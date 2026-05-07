import { model, Schema } from "mongoose";

const CollectionSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  animeItems: { type: [String], default: [] }, // Array of unique item names ever obtained
  fishingItems: { type: [String], default: [] } // Array of unique fish names ever caught
});

export default model("Collection", CollectionSchema);
