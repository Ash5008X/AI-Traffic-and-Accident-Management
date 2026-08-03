const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const auth = require('../middleware/auth');

router.get('/', teamController.getAll);
router.get('/admin', auth, teamController.getByAdmin);
router.get('/my-teams', auth, teamController.getByAdmin);
router.get('/unassigned/pool', auth, teamController.getUnassignedFieldUnits);
router.post('/', auth, teamController.create);
router.delete('/:id', auth, teamController.deleteTeam);
router.post('/:id/members', auth, teamController.addMembers);
router.delete('/:id/members', auth, teamController.removeMember);
router.patch('/:id/remove-member', auth, teamController.removeMember);

module.exports = router;
