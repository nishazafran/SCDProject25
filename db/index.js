const fs = require('fs');
const path = require('path');
const Record = require("./mongo");
const recordUtils = require("./record");
const vaultEvents = require("../events");

// ------------------------------
// BACKUP FUNCTION (works for Mongo)
// ------------------------------
function createBackup(records) {
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-');

  const backupFile = path.join(backupsDir, `backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(records, null, 2), 'utf8');

  console.log(`💾 Backup created: ${backupFile}`);
}

// ------------------------------
// ADD RECORD
// ------------------------------
async function addRecord({ name, value, createdAt }) {
  recordUtils.validateRecord({ name, value, createdAt });

  const newRecord = new Record({
    id: recordUtils.generateId(),
    name,
    value,
    createdAt: new Date(createdAt).toISOString().split("T")[0],
  });

  await newRecord.save();
  vaultEvents.emit("recordAdded", newRecord);

  // Backup after adding
  const all = await Record.find();
  createBackup(all);

  return newRecord;
}

// ------------------------------
// LIST RECORDS
// ------------------------------
async function listRecords() {
  return await Record.find();
}

// ------------------------------
// UPDATE RECORD
// ------------------------------
async function updateRecord(id, newName, newValue) {
  const record = await Record.findOne({ id });
  if (!record) return null;

  record.name = newName;
  record.value = newValue;
  await record.save();

  vaultEvents.emit("recordUpdated", record);

  // backup
  const all = await Record.find();
  createBackup(all);

  return record;
}

// ------------------------------
// DELETE RECORD
// ------------------------------
async function deleteRecord(id) {
  const record = await Record.findOne({ id });
  if (!record) return null;

  await Record.deleteOne({ id });

  vaultEvents.emit("recordDeleted", record);

  // backup AFTER deletion
  const all = await Record.find();
  createBackup(all);

  return record;
}

// ------------------------------
// VAULT STATISTICS (Mongo version)
// ------------------------------
async function getVaultStatistics() {
  const data = await Record.find();

  if (data.length === 0) {
    return {
      total: 0,
      lastModified: "No data",
      longestName: "None",
      longestNameLength: 0,
      earliest: "N/A",
      latest: "N/A"
    };
  }

  // Total records
  const total = data.length;

  // Last modified = latest updatedAt Mongo timestamp
  const lastModified = new Date(
    Math.max(...data.map(r => new Date(r.updatedAt || r.createdAt)))
  )
    .toISOString()
    .replace("T", " ")
    .split(".")[0];

  // Longest name
  let longestName = "";
  data.forEach(r => {
    if (r.name.length > longestName.length) longestName = r.name;
  });

  // Earliest & latest createdAt
  const dates = data.map(r => new Date(r.createdAt));
  const earliest = new Date(Math.min(...dates)).toISOString().split("T")[0];
  const latest = new Date(Math.max(...dates)).toISOString().split("T")[0];

  return {
    total,
    lastModified,
    longestName,
    longestNameLength: longestName.length,
    earliest,
    latest
  };
}

module.exports = {
  addRecord,
  listRecords,
  updateRecord,
  deleteRecord,
  getVaultStatistics
};

