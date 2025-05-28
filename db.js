const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const dbDir = path.join(__dirname, "db");
const dbPath = path.join(dbDir, "sqlite.db");

// Create db directory if it doesn't exist
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

// Read data from data.json
const rawData = fs.readFileSync(path.join(__dirname, "data.json"), "utf8");
const jsonData = JSON.parse(rawData);

console.log("Total records in JSON:", jsonData.length);

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
    return;
  }

  console.log("Database opened at:", dbPath);

  // Enable foreign keys and run in serialized mode
  db.serialize(() => {
    // Drop existing table and create new one
    db.run("DROP TABLE IF EXISTS cpi_prices", (err) => {
      if (err) {
        console.error("Error dropping table:", err.message);
        return;
      }

      console.log("Old table dropped successfully");

      // Create new table
      db.run(`
        CREATE TABLE cpi_prices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          product_name TEXT NOT NULL,
          price REAL NOT NULL
        )
      `, (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
          return;
        }

        console.log("New table created successfully");

        // Begin transaction
        db.run("BEGIN TRANSACTION");

        // Prepare insert statement
        const stmt = db.prepare("INSERT INTO cpi_prices (date, product_name, price) VALUES (?, ?, ?)");

        let totalInserts = 0;
        let successfulInserts = 0;
        let skippedRecords = 0;

        // First count valid records
        jsonData.forEach(item => {
          Object.keys(item).forEach(key => {
            if (key !== "日期" && key !== "農曆") {
              const price = parseFloat(item[key]);
              if (!isNaN(price) && item[key] !== "") {
                totalInserts++;
              }
            }
          });
        });

        console.log(`Preparing to insert ${totalInserts} valid records...`);

        // Insert data from JSON
        jsonData.forEach((item, index) => {
          Object.keys(item).forEach(key => {
            if (key !== "日期" && key !== "農曆") {
              const price = parseFloat(item[key]);

              // Only insert if price is valid
              if (!isNaN(price) && item[key] !== "") {
                stmt.run(
                  item["日期"],
                  key,
                  price,
                  function(err) {
                    if (err) {
                      console.error(`Error inserting data for ${item["日期"]} - ${key}:`, err.message);
                      skippedRecords++;
                    } else {
                      successfulInserts++;
                      if (successfulInserts % 100 === 0) {
                        console.log(`Progress: ${successfulInserts}/${totalInserts} records inserted`);
                      }
                    }

                    // Check if this is the last insert
                    if (successfulInserts + skippedRecords === totalInserts) {
                      // Commit transaction
                      db.run("COMMIT", (err) => {
                        if (err) {
                          console.error("Error committing transaction:", err.message);
                          return;
                        }

                        // Verify the data after commit
                        db.get("SELECT COUNT(*) as count FROM cpi_prices", (err, row) => {
                          if (err) {
                            console.error("Error counting records:", err.message);
                          } else {
                            console.log("\nDatabase verification:");
                            console.log(`Total records in database: ${row.count}`);
                            console.log(`Successfully inserted: ${successfulInserts} records`);
                            console.log(`Skipped invalid records: ${skippedRecords}`);
                            if (row.count === successfulInserts) {
                              console.log("All valid data has been successfully inserted!");
                            } else {
                              console.log("Warning: Record count mismatch!");
                            }
                          }

                          // Close database
                          db.close((err) => {
                            if (err) {
                              console.error("Error closing database:", err.message);
                            } else {
                              console.log("Database connection closed.");
                            }
                          });
                        });
                      });
                    }
                  }
                );
              } else {
                skippedRecords++;
                if ((successfulInserts + skippedRecords) === totalInserts) {
                  db.run("COMMIT");
                }
              }
            }
          });
        });

        stmt.finalize();
      });
    });
  });
});
