import { model, Schema } from "mongoose";
export default model(
"도박",
new Schema({
userid: String,
money: Number,
date: Number,
})
);