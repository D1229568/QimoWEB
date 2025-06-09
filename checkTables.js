const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'sqlite.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database');

  // Get all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error('Error getting tables:', err.message);
      return;
    }
    console.log('Tables in database:', tables);

    // Check if users table exists
    const usersTable = tables.find(t => t.name === 'users');
    if (!usersTable) {
      console.log('Creating users table...');
      db.run(`
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          isOnline TEXT DEFAULT 'off'
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err.message);
        } else {
          console.log('Users table created successfully');
          // Insert a test user
          db.run(`INSERT INTO users (username, password) VALUES (?, ?)`,
            ['admin', 'admin123'],
            function(err) {
              if (err) {
                console.error('Error inserting test user:', err.message);
              } else {
                console.log('Test user created with ID:', this.lastID);
              }
              db.close();
            });
        }
      });
    } else {
      // If users table exists, show its structure
      db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
          console.error('Error getting columns:', err.message);
        } else {
          console.log('Users table columns:', columns);
        }

        // Show sample data
        db.all("SELECT * FROM users LIMIT 5", (err, rows) => {
          if (err) {
            console.error('Error getting users:', err.message);
          } else {
            console.log('Sample users:', rows);
          }
          db.close();
        });
      });
    }
  });
});
