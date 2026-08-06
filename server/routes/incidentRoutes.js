const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incidentController');
const { auth, optionalAuth } = require('../middleware/auth');

// Static & special endpoints first
router.get('/nearby', incidentController.nearby);
router.get('/stats', optionalAuth, incidentController.getStats);
router.get('/heatmap', optionalAuth, incidentController.getHeatmap);
router.get('/relief-dashboard', auth, incidentController.getReliefDashboard);
router.get('/relief-incidents', auth, incidentController.getReliefIncidents);
router.get('/incidents-page-data', optionalAuth, incidentController.getIncidentsPageData);
router.get('/zone-analytics', optionalAuth, incidentController.getZoneAnalytics);
router.get('/dashboard-stats', auth, incidentController.dashboardStats);

// General CRUD
router.post('/', auth, incidentController.create);
router.get('/', optionalAuth, incidentController.getAll);
router.get('/:id', optionalAuth, incidentController.getById);

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
