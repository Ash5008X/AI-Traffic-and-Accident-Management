const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

router.get('/', messageController.getMessages);
router.get('/:incidentId', (req, res, next) => {
  req.query.incidentId = req.params.incidentId;
  return messageController.getMessages(req, res, next);
});
router.post('/', messageController.postMessage);

module.exports = router;
