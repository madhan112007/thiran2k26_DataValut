const express = require('express');
const router = express.Router();
const { authenticateTeam } = require('../middleware/auth');
const { getQuestion } = require('../controllers/questionController');

// Protected routes (require team authentication)
router.use(authenticateTeam);
router.get('/:id', getQuestion);

module.exports = router;