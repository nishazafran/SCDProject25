const fileDB = require('./file');
const recordUtils = require('./record');
const vaultEvents = require('../events');

function addRecord({ name, value, createdAt }) {
  // validate record including createdAt
  recordUtils.validateRecord({ name, value, createdAt });

  const data = fileDB.readDB();
  const newRecord = {
    id: recordUtils.generateId(),
    name,
    value,
    createdAt: new Date(createdAt).toISOString().split('T')[0] // store YYYY-MM-DD
  };

  data.push(newRecord);
  fileDB.writeDB(data);

  vaultEvents.emit('recordAdded', newRecord);
  return newRecord;
}

function listRecords() {
  return fileDB.readDB();
}

function updateRecord(id, newName, newValue) {
  const data = fileDB.readDB();
  const record = data.find(r => r.id === id);
  if (!record) return null;

  record.name = newName;
  record.value = newValue;
  // Do NOT change createdAt on update
  fileDB.writeDB(data);
  vaultEvents.emit('recordUpdated', record);
  return record;
}

function deleteRecord(id) {
  const data = fileDB.readDB();
  const record = data.find(r => r.id === id);
  if (!record) return null;

  const filtered = data.filter(r => r.id !== id);
  fileDB.writeDB(filtered);
  vaultEvents.emit('recordDeleted', record);
  return record;
}

module.exports = { addRecord, listRecords, updateRecord, deleteRecord };

