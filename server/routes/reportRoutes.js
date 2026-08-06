const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, reportController.getReports);
router.get('/download', optionalAuth, reportController.downloadReport);
router.get('/team', reportController.getTeamReport);
router.get('/timeline', reportController.getTimeline);
router.get('/export/pdf', optionalAuth, reportController.exportPdf);
router.get('/export/csv', optionalAuth, reportController.exportCsv);

module.exports = router;
