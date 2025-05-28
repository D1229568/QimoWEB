var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const sqlite3 = require('sqlite3').verbose();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// Database setup
const dbPath = path.join(__dirname, 'db', 'sqlite.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);  // Exit if we can't connect to database
    }
    console.log('Successfully connected to the database at:', dbPath);

    // Verify table exists and has data
    db.get("SELECT COUNT(*) as count FROM cpi_prices", (err, row) => {
        if (err) {
            console.error('Error checking table:', err.message);
        } else {
            console.log(`Database contains ${row ? row.count : 0} records`);
        }
    });
});

// Make db available to routes
app.locals.db = db;

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;

