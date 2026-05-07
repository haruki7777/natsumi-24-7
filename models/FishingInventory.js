import { model, Schema } from "mongoose";

const FishingInventorySchema = new Schema({
  userId: { type: String, required: true, unique: true },
  goldenFish: { type: Number, default: 0 },         // 0.5%
  decentGoldenFish: { type: Number, default: 0 },   // 1%
  mediumFish: { type: Number, default: 0 },         // 10%
  regularFish: { type: Number, default: 0 },        // 20%
  curiousItem: { type: Number, default: 0 },        // 30%
  adultItem: { type: Number, default: 0 },          // Added for 낚시 성인용품
  lastFishingTime: { type: Date, default: 0 },
});

export default model("FishingInventory", FishingInventorySchema);
