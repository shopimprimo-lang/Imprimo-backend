require('dotenv').config();
const chalk = require('chalk');
const mongoose = require('mongoose');

const keys = require('../config/keys');

// The MongoDB driver's SRV handling makes Node emit a DEP0170 warning that contains the
// full connection string, password included. Mask credentials in any warning text.
const emitWarning = process.emitWarning;
process.emitWarning = (warning, ...rest) =>
  emitWarning.call(process, typeof warning === 'string' ? warning.replace(/\/\/[^@\s/]+@/g, '//***@') : warning, ...rest);
const { database } = keys;

const dbState = {
  connected: false,
  error: null,
  attempts: 0,
  url: database.url ? database.url.replace(/\/\/.*@/, '//***:***@') : 'undefined'
};

// No MONGO_URI outside production → spin up an in-memory MongoDB with seed data,
// so the app runs locally without a real database. Data resets on every restart.
const startMemoryDB = async () => {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mem = await MongoMemoryServer.create();
  dbState.inMemory = true;
  return mem.getUri('imprimo');
};

const setupDB = async () => {
  dbState.attempts++;
  try {
    if (!database.url && process.env.NODE_ENV !== 'production') {
      database.url = await startMemoryDB();
      dbState.url = `${database.url} (in-memory, development)`;
    }
    console.log(`${chalk.yellow('⏳')} Connecting to MongoDB at: ${dbState.url}`);
    await mongoose.connect(database.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 seconds timeout
      family: 4 // Force IPv4
    });
    dbState.connected = true;
    dbState.error = null;
    console.log(`${chalk.green('✓')} ${chalk.blue('MongoDB Connected successfully!')}`);
    if (dbState.inMemory) await require('./devSeed')();
  } catch (error) {
    dbState.connected = false;
    dbState.error = error.message || String(error);
    console.error(`${chalk.red('✗')} MongoDB Connection Error:`, error);
    return null;
  }
};

module.exports = { setupDB, dbState };


