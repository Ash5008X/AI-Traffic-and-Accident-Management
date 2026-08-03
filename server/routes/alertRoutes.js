const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const auth = require('../middleware/auth');

router.post('/', auth, alertController.create);
router.get('/active', alertController.getActive);
router.get('/history', alertController.getHistory);
router.get('/my-alerts', auth, alertController.getMyAlerts);
router.post('/send-notification', auth, alertController.sendIncidentNotification);
router.patch('/:id/cancel', auth, alertController.cancel);
router.patch('/:id', auth, alertController.update);

module.exports = router;
