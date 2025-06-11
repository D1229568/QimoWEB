var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const sqlite3 = require('sqlite3').verbose();

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var testRouter = require('./routes/test');

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

// Middleware to check if owner is online and redirect to maintenance page
// Skip for login page and maintenance page itself
app.use((req, res, next) => {
    // Skip this middleware for API routes, login page, maintenance page, and static assets
    if (req.path === '/login' ||
        req.path === '/logout' ||
        req.path === '/login.html' ||
        req.path === '/maintenance.html' ||
        req.path.startsWith('/stylesheets/') ||
        req.path.startsWith('/javascripts/') ||
        req.path.startsWith('/images/') ||
        req.path.startsWith('/api/')) {
        return next();
    }

    // Check if we have a logged-in user via cookie
    const username = req.cookies.username;

    // If no username in cookie, redirect to login page
    if (!username) {
        console.log('No login detected, redirecting to login page');
        return res.redirect('/login.html');
    }

    // If the user is the owner (kenji1), let them access everything
    if (username === 'kenji1') {
        return next();
    }

    // Check if owner is online
    db.get('SELECT isOnline FROM users WHERE username = ?', ['kenji1'], (err, user) => {
        if (err) {
            console.error('Error checking owner status:', err);
            return next(); // Continue in case of error
        }

        // If owner is online and current user is not the owner, redirect to maintenance
        if (user && user.isOnline === 'on' && username !== 'kenji1') {
            console.log('Owner is online, redirecting user to maintenance page');
            return res.redirect('/maintenance.html');
        }

        // Otherwise, continue normally
        next();
    });
});

// Routes
app.use('/', indexRouter);
app.use('/', authRouter);  // Add auth router that handles /login
app.use('/test', testRouter); // Add test router for /test endpoint

// Static file middleware comes AFTER routes
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
