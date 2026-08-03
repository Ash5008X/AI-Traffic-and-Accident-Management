const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.get('/me', auth, authController.me);
router.patch('/preferences', auth, authController.updatePreferences);
router.patch('/update-location', auth, authController.updateLocation);
router.patch('/location', auth, authController.updateLocation);
router.get('/count', authController.getUserCount);

module.exports = router;
