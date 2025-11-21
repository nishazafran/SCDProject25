const Record = require('./mongo');
const recordUtils = require('./record');
const vaultEvents = require('../events');
const fs = require('fs');
const path = require('path');

function createBackup(records) {
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupsDir, `backup_${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(records, null, 2), 'utf8');
  console.log(`💾 Backup created: ${backupFile}`);
}

async function addRecord({ name, value, createdAt }) {
  recordUtils.validateRecord({ name, value, createdAt });

  const newRecord = new Record({
    id: recordUtils.generateId(),
    name,
    value,
    createdAt
  });

  await newRecord.save();
  vaultEvents.emit('recordAdded', newRecord);

  const allRecords = await Record.find();
  createBackup(allRecords);

  return newRecord;
}

async function listRecords() {
  return await Record.find();
}

async function updateRecord(id, newName, newValue) {
  const record = await Record.findOne({ id });
  if (!record) return null;

  record.name = newName;
  record.value = newValue;
  await record.save();

  vaultEvents.emit('recordUpdated', record);

  const allRecords = await Record.find();
  createBackup(allRecords);

  return record;
}

async function deleteRecord(id) {
  const record = await Record.findOne({ id });
  if (!record) return null;

  await Record.deleteOne({ id });
  vaultEvents.emit('recordDeleted', record);

  const allRecords = await Record.find();
  createBackup(allRecords);

  return record;
}

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

  const total = data.length;

  const dbPath = path.join(__dirname, 'data.json'); // optional, for local file stats
  let lastModified = "Unknown";
  try {
    const stats = fs.statSync(dbPath);
    lastModified = stats.mtime.toISOString().replace("T", " ").split(".")[0];
  } catch {}

  let longestName = "";
  data.forEach(r => {
    if (r.name.length > longestName.length) longestName = r.name;
  });

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

module.exports = { addRecord, listRecords, updateRecord, deleteRecord, getVaultStatistics };

