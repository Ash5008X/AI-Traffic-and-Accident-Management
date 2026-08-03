const express = require('express');
const router = express.Router();
const fieldUnitController = require('../controllers/fieldUnitController');
const auth = require('../middleware/auth');

router.get('/', fieldUnitController.getAll);
router.get('/:id', fieldUnitController.getById);
router.patch('/:id/status', auth, fieldUnitController.updateStatus);
router.patch('/:id/arrive', auth, fieldUnitController.markArrived);
router.patch('/:id/location', auth, fieldUnitController.updateLocation);
router.get('/:id/assigned', fieldUnitController.getAssigned);
router.get('/:id/updates', fieldUnitController.getUpdates);
router.get('/:id/profile-stats', fieldUnitController.getProfileStats);

module.exports = router;
