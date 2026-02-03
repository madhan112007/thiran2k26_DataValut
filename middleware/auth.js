const jwt = require('jsonwebtoken');
const Team = require('../models/Team');
const Admin = require('../models/Admin');

// Team authentication middleware
const authenticateTeam = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('Auth middleware - Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('Auth middleware - No token provided');
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Auth middleware - Token decoded:', decoded);
    
    const team = await Team.findById(decoded.teamId);
    
    if (!team) {
      console.log('Auth middleware - Team not found for ID:', decoded.teamId);
      return res.status(401).json({ error: 'Invalid token.' });
    }

    console.log('Auth middleware - Team found:', team.teamName);
    req.team = team;
    next();
  } catch (error) {
    console.log('Auth middleware - Error:', error.message);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.adminId);
    
    if (!admin) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = { authenticateTeam, authenticateAdmin };