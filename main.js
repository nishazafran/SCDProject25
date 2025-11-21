require('dotenv').config(); // load .env first
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mongoose = require('mongoose');
const db = require('./db');
require('./events/logger');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in .env");
  process.exit(1);
}


const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});

// Helper for async input
function ask(q) {
return new Promise(resolve => rl.question(q, answer => resolve(answer)));
}

// Display a single record
function displayRecord(r) {
console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value} | Created At: ${r.createdAt}`);
}

// Show menu options
function showMenu() {
console.log(`
===== NodeVault =====

1. Add Record
2. List Records
3. Update Record
4. Delete Record
5. Search Record
6. Sort Record
7. Export Data
8. View Vault Statistics
9. Exit
   =====================
   `);
   }

// Main loop
async function mainLoop() {
while (true) {
showMenu();
const ans = (await ask("Choose option: ")).trim();


switch (ans) {

  case '1': {
    const name = await ask('Enter name: ');
    const value = await ask('Enter value: ');
    const createdAt = await ask('Enter creation date (YYYY-MM-DD): ');

    const date = new Date(createdAt);
    if (isNaN(date)) {
      console.log("Invalid date format.");
      break;
    }

    try {
      const newRecord = await db.addRecord({
        name,
        value,
        createdAt: date.toISOString().split('T')[0]
      });
      console.log('Record added successfully!');
      displayRecord(newRecord);
    } catch (err) {
      console.log("Error adding record:", err.message);
    }
    break;
  }

  case '2': {
    const records = await db.listRecords();
    if (records.length === 0) console.log('No records found.');
    else records.forEach(displayRecord);
    break;
  }

  case '3': {
    const id = await ask('Enter record ID to update: ');
    const name = await ask('New name: ');
    const value = await ask('New value: ');

    try {
      const updated = await db.updateRecord(Number(id), name, value);
      if (updated) {
        console.log('Record updated!');
        displayRecord(updated);
      } else {
        console.log('Record not found.');
      }
    } catch (err) {
      console.log("Error updating record:", err.message);
    }
    break;
  }

  case '4': {
    const id = await ask('Enter record ID to delete: ');
    try {
      const deleted = await db.deleteRecord(Number(id));
      console.log(deleted ? 'Record deleted!' : 'Record not found.');
    } catch (err) {
      console.log("Error deleting record:", err.message);
    }
    break;
  }

  case '5': {
    const term = await ask('Enter name or ID to search: ');
    const records = await db.listRecords();
    const lower = term.toLowerCase();

    const results = records.filter(r =>
      r.id.toString() === term ||
      r.name.toLowerCase().includes(lower) ||
      r.value.toString().includes(lower)
    );

    if (results.length === 0) console.log('No records found.');
    else results.forEach(displayRecord);
    break;
  }

  case '6': {
    const records = await db.listRecords();
    if (records.length === 0) {
      console.log("No records available.");
      break;
    }

    const field = (await ask("Sort by (name/date): ")).toLowerCase();
    const order = (await ask("Order (asc/desc): ")).toLowerCase();

    const sorted = [...records];

    if (field === "name") {
      sorted.sort((a, b) => order === "asc" ?
        a.name.localeCompare(b.name) :
        b.name.localeCompare(a.name)
      );
    } else if (field === "date") {
      sorted.sort((a, b) => order === "asc" ?
        new Date(a.createdAt) - new Date(b.createdAt) :
        new Date(b.createdAt) - new Date(a.createdAt)
      );
    } else {
      console.log("Invalid field.");
      break;
    }

    console.log("\nSorted Records:");
    sorted.forEach(displayRecord);
    break;
  }

  case '7': {
    const records = await db.listRecords();
    if (records.length === 0) {
      console.log("No data to export.");
      break;
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `export_${timestamp}.txt`;
    const filePath = path.join(__dirname, '..', fileName);

    let out = `=== NodeVault Export ===\nExport Date: ${now.toLocaleString()}\nTotal Records: ${records.length}\nFile Name: ${fileName}\n========================\n\n`;

    records.forEach(r => {
      out += `ID: ${r.id}\nName: ${r.name}\nValue: ${r.value}\nCreated At: ${r.createdAt}\n---------------------\n`;
    });

    fs.writeFileSync(filePath, out, 'utf8');
    console.log(`Exported to ${fileName}`);
    break;
  }

  case '8': {
    const stats = await db.getVaultStatistics();
    console.log("\nVault Statistics:");
    console.log("--------------------------");
    console.log(`Total Records: ${stats.total}`);
    console.log(`Last Modified: ${stats.lastModified}`);
    console.log(`Longest Name: ${stats.longestName} (${stats.longestNameLength} chars)`);
    console.log(`Earliest Record: ${stats.earliest}`);
    console.log(`Latest Record: ${stats.latest}`);
    break;
  }

  case '9':
    console.log("Exiting...");
    rl.close();
    process.exit(0);

  default:
    console.log("Invalid option.");
    break;
}


}
}

// Connect to MongoDB first, then start menu
async function start() {
try {
await mongoose.connect(MONGO_URI);
console.log("Connected to MongoDB");
await mainLoop();
} catch (err) {
console.error("MongoDB connection error:", err);
process.exit(1);
}
}

start();

