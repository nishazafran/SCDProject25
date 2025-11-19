const fs = require('fs');
const path = require('path');

const readline = require('readline');
const db = require('./db');
require('./events/logger'); // Initialize event logger

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to display a record
function displayRecord(r) {
  console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value} | Created At: ${r.createdAt}`);
}

function menu() {
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
10. Exit
=====================
  `);

  rl.question('Choose option: ', ans => {
    switch (ans.trim()) {

      // --------------------- ADD RECORD -----------------------
      case '1':
        rl.question('Enter name: ', name => {
          rl.question('Enter value: ', value => {
            rl.question('Enter creation date (YYYY-MM-DD): ', createdAt => {

              const date = new Date(createdAt);
              if (isNaN(date)) {
                console.log("Invalid date format. Use YYYY-MM-DD.");
                return menu();
              }

              const newRecord = db.addRecord({
          name,
          value,
          createdAt: date.toISOString().split('T')[0]
        });

        console.log('Record added successfully!');
        displayRecord(newRecord);   // SHOW correct record with ID
        menu();

            });
          });
        });
        break;

      // --------------------- LIST RECORDS -----------------------
      case '2':
        const records = db.listRecords();
        if (records.length === 0) console.log('No records found.');
        else records.forEach(displayRecord);
        menu();
        break;

      // --------------------- UPDATE RECORD -----------------------
      case '3':
        rl.question('Enter record ID to update: ', id => {
          rl.question('New name: ', name => {
            rl.question('New value: ', value => {
              const updatedRecord = db.updateRecord(Number(id), name, value);
              if (updatedRecord) {
                console.log('✅ Record updated!');
                displayRecord(updatedRecord);
              } else {
                console.log('❌ Record not found.');
              }
              menu();
            });
          });
        });
        break;

      // --------------------- DELETE RECORD -----------------------
      case '4':
        rl.question('Enter record ID to delete: ', id => {
          const deleted = db.deleteRecord(Number(id));
          console.log(deleted ? 'Record deleted!' : 'Record not found.');
          menu();
        });
        break;

      // --------------------- SEARCH RECORD -----------------------
      case '5':
        rl.question('Enter name or ID to search: ', term => {
          const allRecords = db.listRecords();
          const lowerTerm = term.toLowerCase();

          const results = allRecords.filter(r => 
            r.id.toString() === term ||
            r.name.toLowerCase().includes(lowerTerm) ||
            r.value.toLowerCase().includes(lowerTerm)
          );

          if (results.length === 0) {
            console.log('No records found.');
          } else {
            console.log(`\nFound ${results.length} record(s):`);
            results.forEach(displayRecord);
          }

          menu();
        });
        break;

      // --------------------- SORT RECORD -----------------------
      case '6':
        const sortRecords = db.listRecords();
        if (sortRecords.length === 0) {
          console.log("No records available to sort.");
          return menu();
        }

        rl.question("Sort by (name/date): ", field => {
          field = field.trim().toLowerCase();
          if (field !== "name" && field !== "date") {
            console.log("Invalid field.");
            return menu();
          }

          rl.question("Order (asc/desc): ", order => {
            order = order.trim().toLowerCase();
            if (order !== "asc" && order !== "desc") {
              console.log("Invalid order.");
              return menu();
            }

            const sorted = [...sortRecords];

            if (field === "name") {
              sorted.sort((a, b) => order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
            } else if (field === "date") {
              sorted.sort((a, b) => order === "asc" ? new Date(a.createdAt) - new Date(b.createdAt) : new Date(b.createdAt) - new Date(a.createdAt));
            }

            console.log("\nSorted Records:");
            sorted.forEach(displayRecord);
            menu();
          });
        });
        break;
        
case '7':
  const recordsToExport = db.listRecords();
  if (recordsToExport.length === 0) {
    console.log('No records available to export.');
    return menu();
  }

  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-'); // e.g., 2025-11-19T09-30-15-123Z
  const exportFileName = `export_${timestamp}.txt`;
  const exportFile = path.join(__dirname, '..', exportFileName);

  let content = '';
  content += `=== NodeVault Export ===\n`;
  content += `Export Date: ${now.toLocaleString()}\n`;
  content += `Total Records: ${recordsToExport.length}\n`;
  content += `File Name: ${exportFileName}\n`;
  content += `========================\n\n`;

  recordsToExport.forEach(r => {
    content += `ID: ${r.id}\n`;
    content += `Name: ${r.name}\n`;
    content += `Value: ${r.value}\n`;
    content += `Created At: ${r.createdAt}\n`;
    content += `------------------------\n`;
  });

  fs.writeFileSync(exportFile, content, 'utf8');
  console.log(`Data exported successfully to ${exportFileName}.`);
  menu();
  break;

case '8':
  const stats = db.getVaultStatistics();
  console.log("\nVault Statistics:");
  console.log("--------------------------");
  console.log(`Total Records: ${stats.total}`);
  console.log(`Last Modified: ${stats.lastModified}`);
  console.log(`Longest Name: ${stats.longestName} (${stats.longestNameLength} characters)`);
  console.log(`Earliest Record: ${stats.earliest}`);
  console.log(`Latest Record: ${stats.latest}`);
  menu();
  break;


      case '10':
        console.log('Exiting NodeVault...');
        rl.close();
        break;

      default:
        console.log('Invalid option.');
        menu();
    }
  });
}

menu();

