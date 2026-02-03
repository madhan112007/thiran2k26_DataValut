const Admin = require('../models/Admin');
const Team = require('../models/Team');
const jwt = require('jsonwebtoken');

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET);

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all teams with detailed rankings
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .select('-sessionToken')
      .sort({ finished: -1, finalTime: 1, score: -1, startTime: 1 });

    // Add ranking information
    const teamsWithRanking = teams.map((team, index) => {
      const teamObj = team.toObject();
      
      // Calculate current rank among finished teams
      if (team.finished) {
        const finishedTeams = teams.filter(t => t.finished);
        const teamRank = finishedTeams.findIndex(t => t._id.equals(team._id)) + 1;
        teamObj.currentRank = teamRank;
      } else {
        teamObj.currentRank = null;
      }
      
      // Add progress percentage
      teamObj.progressPercentage = (team.digitsUnlocked.length / 10) * 100;
      
      // Add time spent so far
      if (!team.finished && team.startTime) {
        teamObj.timeSpent = Math.floor((Date.now() - new Date(team.startTime)) / 1000);
      }
      
      // Format attempt timestamps for admin view
      if (team.attemptTimestamps) {
        teamObj.detailedAttempts = {};
        for (let [key, value] of team.attemptTimestamps) {
          teamObj.detailedAttempts[key] = value;
        }
      }
      
      return teamObj;
    });

    res.json(teamsWithRanking);
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get game results
const getGameResults = async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments();
    const finishedTeams = await Team.countDocuments({ finished: true });
    const averageTime = await Team.aggregate([
      { $match: { finished: true } },
      { $group: { _id: null, avgTime: { $avg: '$finalTime' } } }
    ]);

    const questionStats = await Team.aggregate([
      { $unwind: '$attemptsPerQuestion' },
      { $group: {
        _id: '$attemptsPerQuestion.k',
        totalAttempts: { $sum: '$attemptsPerQuestion.v' },
        teamCount: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalTeams,
      finishedTeams,
      completionRate: totalTeams > 0 ? (finishedTeams / totalTeams * 100).toFixed(2) : 0,
      averageTime: averageTime.length > 0 ? Math.round(averageTime[0].avgTime) : 0,
      questionStats
    });
  } catch (error) {
    console.error('Get game results error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Export CSV
const exportCSV = async (req, res) => {
  try {
    const teams = await Team.find().sort({ finalTime: 1, score: -1 });
    
    let csv = 'Rank,Team Name,College,Start Time,End Time,Final Time (seconds),Score,Finished,Current Question,Digits Unlocked\n';
    
    teams.forEach((team, index) => {
      const rank = team.finished ? index + 1 : 'N/A';
      csv += `${rank},"${team.teamName}","${team.collegeName}","${team.startTime}","${team.endTime || 'N/A'}",${team.finalTime || 'N/A'},${team.score},${team.finished},${team.currentQuestion},${team.digitsUnlocked.length}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=game-results.csv');
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Reset game (delete all teams)
const resetGame = async (req, res) => {
  try {
    await Team.deleteMany({});
    res.json({ message: 'Game reset successfully. All team data deleted.' });
  } catch (error) {
    console.error('Reset game error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  adminLogin,
  getAllTeams,
  getGameResults,
  exportCSV,
  resetGame
};