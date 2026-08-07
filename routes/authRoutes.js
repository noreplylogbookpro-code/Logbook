const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Authentication Endpoint
router.post('/login', authController.login);

// User Management (Admin Dashboard)
router.put('/profile', authController.updateProfile);
router.post('/users', authController.createUser);
router.get('/users', authController.getUsers);
router.delete('/users/:id', authController.deleteUser);
router.post('/reset-password', authController.resetPassword);

// Config details endpoint to retrieve dynamic env credentials on login card
router.get('/config', (req, res) => {
    return res.status(200).json({
        superAdminUser: process.env.SUPER_ADMIN_USER,
        superAdminPass: process.env.SUPER_ADMIN_PASS,
        defaultAdminUser: process.env.DEFAULT_ADMIN_USER,
        defaultAdminPass: process.env.DEFAULT_ADMIN_PASS,
        defaultStaffUser: process.env.DEFAULT_STAFF_USER,
        defaultStaffPass: process.env.DEFAULT_STAFF_PASS
    });
});

module.exports = router;
