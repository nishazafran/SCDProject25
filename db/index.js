const fs = require('fs');
const path = require('path');

function createBackup(records) {
  const backupsDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir);

  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-');

  const backupFile = path.join(backupsDir, `backup_${timestamp}.json`);

  fs.writeFileSync(backupFile, JSON.stringify(records, null, 2), 'utf8');
  console.log(`WBackup created: ${backupFile}`);
}

const fileDB = require('./file');
const recordUtils = require('./record');
const vaultEvents = require('../events');


// ------------------------------
// ADD RECORD (Backup FIXED)
// ------------------------------
function addRecord({ name, value, createdAt }) {
  recordUtils.validateRecord({ name, value, createdAt });

  const data = fileDB.readDB();

  const newRecord = {
    id: recordUtils.generateId(),
    name,
    value,
    createdAt: new Date(createdAt).toISOString().split('T')[0]
  };

  data.push(newRecord);
  fileDB.writeDB(data);

  // FIX: Now backup created on ADD
  createBackup(data);

  vaultEvents.emit('recordAdded', newRecord);
  return newRecord;
}


// ------------------------------
function listRecords() {
  return fileDB.readDB();
}


// ------------------------------
// UPDATE RECORD (backup stays here)
// ------------------------------
function updateRecord(id, newName, newValue) {
  const data = fileDB.readDB();
  const record = data.find(r => r.id === id);
  if (!record) return null;

  record.name = newName;
  record.value = newValue;

  fileDB.writeDB(data);

  createBackup(data);

  vaultEvents.emit('recordUpdated', record);
  return record;
}


// ------------------------------
// DELETE RECORD (correct backup)
// ------------------------------
function deleteRecord(id) {
  const data = fileDB.readDB();
  const record = data.find(r => r.id === id);
  if (!record) return null;

  const filtered = data.filter(r => r.id !== id);
  fileDB.writeDB(filtered);

  createBackup(filtered);

  vaultEvents.emit('recordDeleted', record);
  return record;
}

module.exports = { addRecord, listRecords, updateRecord, deleteRecord };

