// server.js
const express = require('express');
const mongoose = require('mongoose');
const Record = require('./db/mongo'); // your Mongoose model
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("MongoDB connection error:", err));

app.get('/', async (req, res) => {
  let records;
  try {
    records = await Record.find().lean();
  } catch (err) {
    records = [];
  }

  let html = `<h1>NodeVault App is Running</h1>`;
  html += `<h2>Records in MongoDB:</h2>`;
  if (records.length === 0) html += `<p>No records found.</p>`;
  else {
    html += `<ul>`;
    records.forEach(r => {
      html += `<li>ID: ${r.id}, Name: ${r.name}, Value: ${r.value}, CreatedAt: ${r.createdAt}</li>`;
    });
    html += `</ul>`;
  }

  res.send(html);
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));

