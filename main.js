const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const db = require('./db');
require('./events/logger');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
console.log("Mongo URI from .env:", MONGO_URI);


const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});

function ask(question) {
return new Promise(function(resolve){ rl.question(question, resolve); });
}

function displayRecord(r) {
console.log("ID: " + r.id + " | Name: " + r.name + " | Value: " + r.value + " | Created At: " + r.createdAt);
}

async function menu() {
console.log(
"===== NodeVault =====\n" +
"1. Add Record\n" +
"2. List Records\n" +
"3. Update Record\n" +
"4. Delete Record\n" +
"5. Search Record\n" +
"6. Sort Record\n" +
"7. Export Data\n" +
"8. View Vault Statistics\n" +
"9. Exit\n" +
"====================="
);

var ans = (await ask("Choose option: ")).trim();

switch(ans) {


case '1': {
  var name = await ask('Enter name: ');
  var value = await ask('Enter value: ');
  var createdAtInput = await ask('Enter creation date (YYYY-MM-DD): ');
  var date = new Date(createdAtInput);
  if (isNaN(date)) {
    console.log("Invalid date format. Use YYYY-MM-DD.");
    break;
  }
  try {
    var newRecord = await db.addRecord({ name: name, value: value, createdAt: date.toISOString().split('T')[0] });
    console.log('Record added successfully!');
    displayRecord(newRecord);
  } catch(err) {
    console.log("Error adding record: " + err.message);
  }
  break;
}

case '2': {
  var records = await db.listRecords();
  if (records.length === 0) console.log('No records found.');
  else records.forEach(displayRecord);
  break;
}

case '3': {
  var id = await ask('Enter record ID to update: ');
  var name = await ask('New name: ');
  var value = await ask('New value: ');
  try {
    var updated = await db.updateRecord(Number(id), name, value);
    if (updated) {
      console.log('Record updated!');
      displayRecord(updated);
    } else {
      console.log('Record not found.');
    }
  } catch(err) {
    console.log("Error updating record: " + err.message);
  }
  break;
}

case '4': {
  var id = await ask('Enter record ID to delete: ');
  try {
    var deleted = await db.deleteRecord(Number(id));
    console.log(deleted ? 'Record deleted!' : 'Record not found.');
  } catch(err) {
    console.log("Error deleting record: " + err.message);
  }
  break;
}

case '5': {
  var term = await ask('Enter name or ID to search: ');
  var records = await db.listRecords();
  var lower = term.toLowerCase();
  var results = records.filter(function(r){ return r.id.toString() === term || r.name.toLowerCase().includes(lower) || r.value.toLowerCase().includes(lower); });
  if (results.length === 0) console.log('No records found.');
  else results.forEach(displayRecord);
  break;
}

case '6': {
  var records = await db.listRecords();
  if (records.length === 0) { console.log("No records available."); break; }
  var field = (await ask("Sort by (name/date): ")).toLowerCase();
  var order = (await ask("Order (asc/desc): ")).toLowerCase();
  var sorted = records.slice();
  if (field === "name") { sorted.sort(function(a,b){ return order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name); }); }
  else if (field === "date") { sorted.sort(function(a,b){ return order === "asc" ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt); }); }
  else { console.log("Invalid field."); break; }
  console.log("\nSorted Records:");
  sorted.forEach(displayRecord);
  break;
}

case '7': {
  var records = await db.listRecords();
  if (records.length === 0) { console.log("No records to export."); break; }
  var now = new Date();
  var timestamp = now.toISOString().replace(/[:.]/g,'-');
  var fileName = "export_" + timestamp + ".txt";
  var filePath = path.join(__dirname, '..', fileName);
  var content = "=== NodeVault Export ===\nExport Date: " + now.toLocaleString() + "\nTotal Records: " + records.length + "\nFile Name: " + fileName + "\n========================\n\n";
  records.forEach(function(r){ content += "ID: " + r.id + "\nName: " + r.name + "\nValue: " + r.value + "\nCreated At: " + r.createdAt + "\n---------------------\n"; });
  fs.writeFileSync(filePath, content, 'utf8');
  console.log("Exported to " + fileName);
  break;
}

case '8': {
  var stats = await db.getVaultStatistics();
  console.log("\nVault Statistics:");
  console.log("--------------------------");
  console.log("Total Records: " + stats.total);
  console.log("Last Modified: " + stats.lastModified);
  console.log("Longest Name: " + stats.longestName + " (" + stats.longestNameLength + " chars)");
  console.log("Earliest Record: " + stats.earliest);
  console.log("Latest Record: " + stats.latest);
  break;
}

case '9':
  console.log("Exiting NodeVault...");
  rl.close();
  process.exit(0);

default:
  console.log("Invalid option.");


}

await menu();
}

async function start() {
try {
await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB");
await menu();
} catch(err) {
console.error("MongoDB connection error:", err);
process.exit(1);
}
}

start();

