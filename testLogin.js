const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db', 'sqlite.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to database successfully');

  // Test specific user credentials
  const username = 'kenji1';
  const password = '123';

  console.log(`Testing login with username: "${username}" and password: "${password}"`);

  // Check if user exists with provided credentials
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err) {
      console.error('Database query error:', err);
      process.exit(1);
    }

    if (!user) {
      console.log('No matching user found with these credentials.');
      // Try to find any user with that username to see if password might be wrong
      db.get('SELECT * FROM users WHERE username = ?', [username], (err, userWithUsername) => {
        if (err) {
          console.error('Database error:', err);
        } else if (userWithUsername) {
          console.log('User with this username exists, but password might be incorrect.');
          console.log('User in DB:', userWithUsername);
        } else {
          console.log('No user found with this username.');
        }

        // Show all users in the database
        db.all('SELECT * FROM users', [], (err, allUsers) => {
          if (err) {
            console.error('Error querying all users:', err);
          } else {
            console.log('All users in database:');
            console.log(allUsers);
          }
          db.close();
        });
      });
    } else {
      console.log('Login successful! User found:', user);
      db.close();
    }
  });
});
