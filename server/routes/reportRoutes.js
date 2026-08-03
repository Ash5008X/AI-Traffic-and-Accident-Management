const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/', reportController.getReports);
router.get('/team', reportController.getTeamReport);
router.get('/timeline', reportController.getTimeline);
router.get('/export/pdf', reportController.exportPdf);
router.get('/export/csv', reportController.exportCsv);

module.exports = router;
