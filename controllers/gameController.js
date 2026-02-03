const Team = require('../models/Team');

let gameStartTime = null;
let gameEndTime = null;
const GAME_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

// Start new game round
const startGameRound = async (req, res) => {
  try {
    gameStartTime = new Date();
    gameEndTime = new Date(gameStartTime.getTime() + GAME_DURATION);
    
    // Reset all teams
    await Team.deleteMany({});
    
    res.json({
      message: 'New game round started',
      startTime: gameStartTime,
      endTime: gameEndTime,
      duration: GAME_DURATION / 1000
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get game status
const getGameStatus = async (req, res) => {
  try {
    const now = new Date();
    const isActive = gameStartTime && now < gameEndTime;
    const timeRemaining = isActive ? Math.max(0, gameEndTime - now) : 0;
    
    res.json({
      isActive,
      startTime: gameStartTime,
      endTime: gameEndTime,
      timeRemaining: Math.floor(timeRemaining / 1000),
      currentTime: now
    });
  } catch (error) {
    console.error('Get game status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Auto-finish teams when time expires
const checkGameExpiry = async () => {
  if (!gameStartTime || !gameEndTime) return;
  
  const now = new Date();
  if (now >= gameEndTime) {
    try {
      // Auto-finish all active teams
      const activeTeams = await Team.find({ finished: false });
      
      for (const team of activeTeams) {
        team.finished = true;
        team.endTime = gameEndTime;
        team.finalTime = Math.floor((gameEndTime - team.startTime) / 1000);
        team.calculateScore();
        await team.save();
      }
      
      console.log(`Game round ended. Auto-finished ${activeTeams.length} teams.`);
    } catch (error) {
      console.error('Auto-finish teams error:', error);
    }
  }
};

// Check every 10 seconds for game expiry
setInterval(checkGameExpiry, 10000);

module.exports = {
  startGameRound,
  getGameStatus,
  checkGameExpiry
};