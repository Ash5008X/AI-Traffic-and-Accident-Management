const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// Apply protection to all notification routes
router.use(auth);

// GET /api/notifications
router.get('/', notificationController.getAll);

// PATCH /api/notifications/read-all
router.patch('/read-all', notificationController.markAllAsRead);

// PATCH /api/notifications/:id/read
router.patch('/:id/read', notificationController.markAsRead);

module.exports = router;
