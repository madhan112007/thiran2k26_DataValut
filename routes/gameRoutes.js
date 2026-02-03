const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const {
  startGameRound,
  getGameStatus
} = require('../controllers/gameController');

// Public routes
router.get('/status', getGameStatus);

// Protected admin routes
router.post('/start', authenticateAdmin, startGameRound);

module.exports = router;