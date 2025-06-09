const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'sqlite.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');

  // Check the structure of the users table
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Error getting columns:', err.message);
    } else {
      console.log('Users table columns:', columns);
    }

    // Show sample data from the users table
    db.all("SELECT * FROM users LIMIT 5", (err, rows) => {
      if (err) {
        console.error('Error getting users:', err.message);
      } else {
        console.log('Users in database:', rows);
      }

      db.close();
    });
  });
});
