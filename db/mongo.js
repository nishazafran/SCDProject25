const mongoose = require("mongoose");

const MONGO_URI = "mongodb://localhost:27017/nodevault";  // HARD CODED

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));
const recordSchema = new mongoose.Schema({
  id: Number,
  name: String,
  value: Number,
  createdAt: String,
}, { timestamps: true });


// Collection
const Record = mongoose.model("Record", recordSchema);

module.exports = Record;
