const mongoose = require('mongoose');
require('dotenv').config();
const Holiday = require('./models/Holiday');

const holidays = [
  { name: 'Makar Sankranti / Pongal', date: '2026-01-14' },
  { name: 'Republic Day', date: '2026-01-26' },
  { name: 'Maha Shivratri', date: '2026-02-15' },
  { name: 'Holi', date: '2026-03-03' },
  { name: 'Ram Navami', date: '2026-03-27' },
  { name: 'Eid ul-Fitr', date: '2026-03-20' },
  { name: 'Mahavir Jayanti', date: '2026-03-31' },
  { name: 'Good Friday', date: '2026-04-03' },
  { name: 'Dr. Ambedkar Jayanti', date: '2026-04-14' },
  { name: 'Buddha Purnima', date: '2026-05-01' },
  { name: 'Eid ul-Adha', date: '2026-05-27' },
  { name: 'Independence Day', date: '2026-08-15' },
  { name: 'Janmashtami', date: '2026-09-04' },
  { name: 'Ganesh Chaturthi', date: '2026-09-14' },
  { name: 'Mahatma Gandhi Jayanti', date: '2026-10-02' },
  { name: 'Dussehra', date: '2026-10-20' },
  { name: 'Diwali', date: '2026-11-08' },
  { name: 'Guru Nanak Jayanti', date: '2026-11-24' },
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
