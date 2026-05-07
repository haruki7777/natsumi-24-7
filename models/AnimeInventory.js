import { model, Schema } from "mongoose";

const AnimeInventorySchema = new Schema({
  userId: { type: String, required: true, unique: true },
  items: { 
    type: Map, 
    of: Number, 
    default: {} 
  }
});

export default model("AnimeInventory", AnimeInventorySchema);
