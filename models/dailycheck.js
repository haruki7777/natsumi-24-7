import { model, Schema } from "mongoose";
export default model(
"출석체크",
new Schema({
userid: String,
count: Number,
date: Number,
})
);