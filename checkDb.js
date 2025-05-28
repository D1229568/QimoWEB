const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'sqlite.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        return;
    }
    console.log('Connected to database');

    // Check table structure
    db.all("SELECT * FROM cpi_prices LIMIT 5", (err, rows) => {
        if (err) {
            console.error('Error querying database:', err.message);
            return;
        }
        console.log('Sample data:', rows);

        // Get total count
        db.get("SELECT COUNT(*) as count FROM cpi_prices", (err, row) => {
            if (err) {
                console.error('Error counting records:', err.message);
                return;
            }
            console.log('Total records:', row.count);
            db.close();
        });
    });
});
