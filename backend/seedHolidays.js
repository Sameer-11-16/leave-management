const mongoose = require('mongoose');
require('dotenv').config();
const Holiday = require('./models/Holiday');

const holidays = [
  { name: 'Republic Day', date: '2026-01-26' },
  { name: 'Holi', date: '2026-03-03' },
  { name: 'Good Friday', date: '2026-04-03' },
  { name: 'Eid ul-Fitr', date: '2026-03-20' },
  { name: 'Independence Day', date: '2026-08-15' },
  { name: 'Mahatma Gandhi Jayanti', date: '2026-10-02' },
  { name: 'Dussehra', date: '2026-10-18' },
  { name: 'Diwali', date: '2026-11-08' },
  { name: 'Christmas Day', date: '2026-12-25' }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    
    // Clear existing DB records? No, maybe just insert if not exists.
    for (let h of holidays) {
      const exists = await Holiday.findOne({ name: h.name, date: h.date });
      if (!exists) {
        await Holiday.create(h);
        console.log(`Added: ${h.name}`);
      } else {
        console.log(`Already exists: ${h.name}`);
      }
    }
    console.log('Seed formatting complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
