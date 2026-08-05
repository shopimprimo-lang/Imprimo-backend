require('dotenv').config();
const chalk = require('chalk');
const mongoose = require('mongoose');

const keys = require('../config/keys');
const { database } = keys;

const dbState = {
  connected: false,
  error: null,
  attempts: 0,
  url: database.url ? database.url.replace(/\/\/.*@/, '//***:***@') : 'undefined'
};

const setupDB = async () => {
  dbState.attempts++;
  try {
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
  } catch (error) {
    dbState.connected = false;
    dbState.error = error.message || String(error);
    console.error(`${chalk.red('✗')} MongoDB Connection Error:`, error);
    return null;
  }
};

module.exports = { setupDB, dbState };


