// db/mongo.js
require('dotenv').config(); // load .env first
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

const recordSchema = new mongoose.Schema({
  id: Number,
  name: String,
  value: Number,
  createdAt: String,
});

const Record = mongoose.model("Record", recordSchema);

module.exports = Record;

