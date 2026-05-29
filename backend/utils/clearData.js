const mongoose = require('mongoose');
const Word = require('../models/Word');
const connectDB = require('../config/db');
require('dotenv').config();

const clearDB = async () => {
  try {
    await connectDB();
    console.log('Connecting and purging all collection data...');
    
    await Word.deleteMany({});
    console.log('Cleared all Words.');

    console.log('Database Purge Complete!');
    process.exit(0);
  } catch (error) {
    console.error(`Error purging database: ${error.message}`);
    process.exit(1);
  }
};

clearDB();
