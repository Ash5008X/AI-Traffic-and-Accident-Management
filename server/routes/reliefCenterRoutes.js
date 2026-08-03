const express = require('express');
const router = express.Router();
const reliefCenterController = require('../controllers/reliefCenterController');
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');

router.get('/', reliefCenterController.getAll);
router.get('/unassigned', auth, teamController.getUnassignedFieldUnits);
router.patch('/:id/status', auth, reliefCenterController.updateStatus);

module.exports = router;
