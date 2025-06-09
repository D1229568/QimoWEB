var express = require('express');
var router = express.Router();

// Login route
router.post('/login', function(req, res) {
    const { username, password, type } = req.body;
    const db = req.app.locals.db;

    console.log('Login attempt received:', { username, password, type });

    // Handle guest login
    if (type === 'guest') {
        const guestUsername = username || 'Guest';

        console.log('Processing guest login for:', guestUsername);

        // Set cookie for the guest user
        res.cookie('username', guestUsername, {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.json({ success: true, message: 'Guest login successful', username: guestUsername });
    }

    // Handle owner/regular user login
    if (!username || !password) {
        console.log('Missing credentials');
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    // Check if user exists with provided credentials
    db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ success: false, message: 'Database error' });
        }

        if (!user) {
            console.log('Invalid credentials for:', username);
            return res.status(401).json({ success: false, message: 'Invalid username or password' });
        }

        console.log('User found:', user);

        // Update user status to online
        db.run('UPDATE users SET isOnline = ? WHERE username = ?', ['on', username], (err) => {
            if (err) {
                console.error('Error updating user status:', err);
                return res.status(500).json({ success: false, message: 'Error updating user status' });
            }

            console.log('User status updated to online for:', username);

            // Set cookie to remember the logged in user
            // Cookie will expire in 24 hours
            res.cookie('username', username, {
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            return res.json({ success: true, message: 'Login successful' });
        });
    });
});

// Logout route
router.post('/logout', function(req, res) {
    const username = req.cookies.username;
    const db = req.app.locals.db;

    console.log('Logout request received for:', username);

    if (!username) {
        return res.status(400).json({ success: false, message: 'Not logged in' });
    }

    // Update user status to offline if it's not a guest
    if (!username.startsWith('Guest')) {
        db.run('UPDATE users SET isOnline = ? WHERE username = ?', ['off', username], (err) => {
            if (err) {
                console.error('Error updating user status during logout:', err);
                // Continue with logout even if updating status fails
            } else {
                console.log('User status updated to offline for:', username);
            }
        });
    }

    // Clear the cookie
    res.clearCookie('username');

    return res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
