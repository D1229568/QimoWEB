var express = require('express');
var router = express.Router();

// Test route to check maintenance mode status
router.get('/check-maintenance', function(req, res) {
    const db = req.app.locals.db;

    // Check if owner is online
    db.get('SELECT isOnline FROM users WHERE username = ?', ['kenji1'], (err, user) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error checking owner status',
                error: err.message
            });
        }

        const isOwnerOnline = (user && user.isOnline === 'on');
        const currentUser = req.cookies.username || 'not logged in';
        const wouldRedirectToMaintenance = isOwnerOnline && currentUser !== 'kenji1';

        // Return the status
        return res.json({
            success: true,
            ownerStatus: isOwnerOnline ? 'online' : 'offline',
            currentUser: currentUser,
            maintenanceModeActive: isOwnerOnline,
            wouldRedirectToMaintenance: wouldRedirectToMaintenance,
            message: wouldRedirectToMaintenance ?
                'Maintenance mode is active. Regular users will be redirected to maintenance page.' :
                'Maintenance mode is not active or you are the owner. No redirection will occur.'
        });
    });
});

module.exports = router;
