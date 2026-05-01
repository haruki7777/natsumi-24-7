const { model, Schema } = require("mongoose");
module.exports = model(
"출석체크",
new Schema({
userid: String,
count: Number,
date: Number,
})
);