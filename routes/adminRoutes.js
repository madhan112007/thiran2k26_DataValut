const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const {
  adminLogin,
  getAllTeams,
  getGameResults,
  exportCSV,
  resetGame
} = require('../controllers/adminController');

// Public admin routes
router.post('/login', adminLogin);

// Protected admin routes
router.use(authenticateAdmin);
router.get('/teams', getAllTeams);
router.get('/results', getGameResults);
router.get('/export-csv', exportCSV);
router.delete('/reset', resetGame);

module.exports = router;