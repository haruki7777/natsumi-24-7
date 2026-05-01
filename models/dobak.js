const { model, Schema } = require("mongoose");
module.exports = model(
"도박",
new Schema({
userid: String,
money: Number,
date: Number,
})
);