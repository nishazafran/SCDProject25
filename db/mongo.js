// db/mongo.js
require('dotenv').config(); // safe to call again if already loaded
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env");
  process.exit(1);
}

// connect here if you want central connect; main.js also connects before start()
// but keeping this connection code is OK if this file is required before connect
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB (mongo.js)"))
  .catch(err => console.error("MongoDB connection error:", err));

// Schema with timestamps so we track updatedAt/createdAt automatically
const recordSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: String } // store user-provided created date as YYYY-MM-DD string
}, { timestamps: true });

const Record = mongoose.model("Record", recordSchema);

module.exports = Record;

