const mongoose = require('mongoose');
require('dotenv').config();
const Holiday = require('./models/Holiday');

async function removeAll() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    // Completely wipe all holidays
    const result = await Holiday.deleteMany({});
    console.log(`Deleted ${result.deletedCount} holidays from the database.`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

removeAll();
