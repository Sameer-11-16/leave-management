const mongoose = require('mongoose');
require('dotenv').config();
const Holiday = require('./models/Holiday');
const fs = require('fs');
const path = require('path');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const filePath = path.join(__dirname, 'holidays_50yrs.json');
    if (!fs.existsSync(filePath)) {
      console.error('Holidays JSON file not found. Run the Python generator first.');
      process.exit(1);
    }

    const holidays = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`Preparing to seed ${holidays.length} holidays...`);

    let added = 0;
    let skipped = 0;

    // Process in batches for better performance
    for (let h of holidays) {
      // Check for existing holiday on same date with same name
      const exists = await Holiday.findOne({ name: h.name, date: h.date });
      if (!exists) {
        await Holiday.create(h);
        added++;
        if (added % 50 === 0) console.log(`Seeding progress: ${added} added...`);
      } else {
        skipped++;
      }
    }

    console.log(`\nSeed Summary:`);
    console.log(`-------------------------`);
    console.log(`Total Added:   ${added}`);
    console.log(`Total Skipped: ${skipped}`);
    console.log(`-------------------------`);
    console.log('Seeding process completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seed();
