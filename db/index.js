// db/index.js
const fs = require('fs');
const path = require('path');
const Record = require('./mongo');
const recordUtils = require('./record'); // assumes you have record.js with validate/generateId
const vaultEvents = require('../events'); // your event emitter setup

// Create backups directory if missing, and write backup
function createBackup(records) {
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupsDir, `backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(records, null, 2), 'utf8');
  console.log(`💾 Backup created: ${backupFile}`);
}

// Add record
async function addRecord({ name, value, createdAt }) {
  // if you have recordUtils.validateRecord, use it
  if (recordUtils && typeof recordUtils.validateRecord === 'function') {
    recordUtils.validateRecord({ name, value, createdAt });
  }

  const newRecord = new Record({
    id: recordUtils ? recordUtils.generateId() : Date.now(), // fallback id
    name,
    value,
    createdAt: createdAt
  });

  await newRecord.save();
  if (vaultEvents && vaultEvents.emit) vaultEvents.emit('recordAdded', newRecord);

  const allRecords = await Record.find();
  createBackup(allRecords);

  return newRecord;
}

// List all records
async function listRecords() {
  return await Record.find().sort({ id: 1 }).lean();
}

// Update record
async function updateRecord(id, newName, newValue) {
  const record = await Record.findOne({ id });
  if (!record) return null;

  record.name = newName;
  record.value = newValue;
  await record.save();

  if (vaultEvents && vaultEvents.emit) vaultEvents.emit('recordUpdated', record);

  const allRecords = await Record.find();
  createBackup(allRecords);

  return record;
}

// Delete record
async function deleteRecord(id) {
  const record = await Record.findOne({ id });
  if (!record) return null;

  await Record.deleteOne({ id });

  if (vaultEvents && vaultEvents.emit) vaultEvents.emit('recordDeleted', record);

  const allRecords = await Record.find();
  createBackup(allRecords);

  return record;
}

// Vault statistics
async function getVaultStatistics() {
  const data = await Record.find().lean();

  if (!data || data.length === 0) {
    return {
      total: 0,
      lastModified: "No data",
      longestName: "None",
      longestNameLength: 0,
      earliest: "N/A",
      latest: "N/A"
    };
  }

  const total = data.length;

  // lastModified: use latest updatedAt or createdAt
  const lastModifiedDate = new Date(Math.max(...data.map(r => {
    const d = r.updatedAt || r.createdAt;
    return new Date(d);
  })));
  const lastModified = isNaN(lastModifiedDate) ? "Unknown" : lastModifiedDate.toISOString().replace("T", " ").split(".")[0];

  // longest name
  let longestName = "";
  data.forEach(r => {
    if (r.name && r.name.length > longestName.length) longestName = r.name;
  });

  // earliest & latest from createdAt field
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

