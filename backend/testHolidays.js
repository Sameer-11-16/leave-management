const Holidays = require('date-holidays');
const hd = new Holidays('IN');
console.log(JSON.stringify(hd.getHolidays(2026), null, 2));
