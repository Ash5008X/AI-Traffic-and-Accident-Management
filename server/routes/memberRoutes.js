const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const fieldUnitController = require('../controllers/fieldUnitController');
const auth = require('../middleware/auth');

router.get('/field-units', auth, authController.getFieldUnits);
router.patch('/update-location', auth, authController.updateLocation);
router.get('/:id/profile-stats', fieldUnitController.getProfileStats);

module.exports = router;
