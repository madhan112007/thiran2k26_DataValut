const express = require('express');
const router = express.Router();
const { authenticateTeam } = require('../middleware/auth');
const {
  registerTeam,
  submitAnswer,
  useHint,
  submitFinalCode,
  finishEarly,
  getLeaderboard,
  getTeamProgress,
  skipQuestion
} = require('../controllers/teamController');

// Public routes
router.post('/register', registerTeam);
router.get('/leaderboard', getLeaderboard);

// Protected routes (require team authentication)
router.use(authenticateTeam);
router.post('/answer/submit', submitAnswer);
router.post('/hint/use', useHint);
router.post('/final/submit', submitFinalCode);
router.post('/finish-early', (req, res, next) => {
  console.log('Finish early route hit');
  finishEarly(req, res, next);
});
router.get('/test', (req, res) => {
  res.json({ message: 'Test route working' });
});
router.post('/skip', skipQuestion);
router.get('/progress', getTeamProgress);

console.log('Team routes loaded with finish-early endpoint');

module.exports = router;