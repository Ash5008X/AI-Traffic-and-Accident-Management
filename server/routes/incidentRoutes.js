const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const auth = require('../middleware/auth');

// Static & special endpoints first
router.get('/nearby', incidentController.nearby);
router.get('/stats', incidentController.getStats);
router.get('/heatmap', incidentController.getHeatmap);
router.get('/dashboard-stats', auth, incidentController.dashboardStats);

// General CRUD
router.post('/', auth, incidentController.create);
router.get('/', incidentController.getAll);
router.get('/:id', incidentController.getById);

// Status & assignment actions
router.patch('/:id/status', auth, incidentController.updateStatus);
router.patch('/:id/accept', auth, incidentController.accept);
router.patch('/:id/assign', auth, incidentController.accept);
router.patch('/:id/dismiss', auth, incidentController.dismiss);

// Incident sub-actions
router.post('/:id/chat', auth, incidentController.addChat);
router.post('/:id/action', auth, incidentController.addAction);
router.post('/:id/backup', auth, incidentController.backupRequest);
router.post('/:id/request-assignment', auth, incidentController.requestAssignment);

module.exports = router;
