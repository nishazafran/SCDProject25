function validateRecord(record) {
  if (!record.name || !record.value) 
    throw new Error('Record must have both name and value.');
  if (!record.createdAt) 
    throw new Error('Record must have createdAt date.');
  const date = new Date(record.createdAt);
  if (isNaN(date)) throw new Error('Invalid date format for createdAt.');
  return true;
}

function generateId() {
  return Date.now(); // unique timestamp-based ID
}

module.exports = { validateRecord, generateId };

