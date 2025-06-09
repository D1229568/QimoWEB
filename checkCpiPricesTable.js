const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the SQLite database
const db = new sqlite3.Database(path.join(__dirname, 'db', 'sqlite.db'), (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    return;
  }
  console.log('Connected to database');
});

// Get table info for cpi_prices
db.all("PRAGMA table_info(cpi_prices);", [], (err, rows) => {
  if (err) {
    console.error('Error getting table info:', err.message);
    return;
  }
  console.log('cpi_prices table columns:', rows);

  // Get sample data from cpi_prices
  db.all("SELECT * FROM cpi_prices LIMIT 1", [], (err, rows) => {
    if (err) {
      console.error('Error getting sample data:', err.message);
    } else {
      console.log('Sample cpi_prices data:', rows);
    }

    // Close the database connection
    db.close();
  });
});
