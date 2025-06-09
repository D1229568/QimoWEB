const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Open database connection
const dbPath = path.join(__dirname, 'db', 'sqlite.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Connected to the SQLite database');
});

// Check if users table exists and drop it if it does
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='users'", (err, row) => {
  if (err) {
    console.error("Error checking table:", err.message);
    return;
  }

  if (row) {
    // Table exists, drop it
    db.run("DROP TABLE users", (err) => {
      if (err) {
        console.error("Error dropping users table:", err.message);
        return;
      }
      console.log("Old users table dropped successfully");
      createUsersTable();
    });
  } else {
    // Table doesn't exist, create it
    createUsersTable();
  }
});

// Function to create users table and insert record
function createUsersTable() {
  db.run(`
    CREATE TABLE users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      isOnline TEXT DEFAULT 'off'
    )
  `, (err) => {
    if (err) {
      console.error("Error creating users table:", err.message);
      return;
    }

    console.log("Users table created successfully");

    // Insert initial user record
    db.run(`INSERT INTO users (username, password, isOnline) VALUES (?, ?, ?)`,
      ["kenji1", "123", "off"],
      function(err) {
        if (err) {
          console.error("Error inserting user record:", err.message);
          return;
        }
        console.log("Initial user record inserted successfully");
        console.log("Username: kenji1, Password: 123, isOnline: off");

        // Close the database connection
        db.close((err) => {
          if (err) {
            console.error("Error closing database:", err.message);
            return;
          }
          console.log("Database connection closed");
        });
      }
    );
  });
}
