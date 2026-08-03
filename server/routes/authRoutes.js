const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', auth, authController.me);
router.patch('/preferences', auth, authController.updatePreferences);
router.patch('/update-location', auth, authController.updateLocation);
router.get('/field-units', auth, authController.getFieldUnits);
router.get('/user-count', authController.getUserCount);

module.exports = router;
