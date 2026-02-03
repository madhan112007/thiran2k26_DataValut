const Team = require('../models/Team');
const Question = require('../models/Question');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Register team
const registerTeam = async (req, res) => {
  try {
    const { teamName, collegeName } = req.body;

    if (!teamName || !collegeName) {
      return res.status(400).json({ error: 'Team name and college name are required' });
    }

    // Check if team name already exists
    const existingTeam = await Team.findOne({ teamName: teamName.trim() });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team name already exists' });
    }

    // Generate session token
    const sessionToken = jwt.sign({ teamName, timestamp: Date.now() }, process.env.JWT_SECRET);

    const team = new Team({
      teamName: teamName.trim(),
      collegeName: collegeName.trim(),
      sessionToken
    });

    await team.save();

    // Generate JWT token
    const token = jwt.sign({ teamId: team._id }, process.env.JWT_SECRET);

    res.status(201).json({
      message: 'Team registered successfully',
      token,
      team: {
        id: team._id,
        teamName: team.teamName,
        collegeName: team.collegeName,
        currentQuestion: team.currentQuestion,
        startTime: team.startTime
      },
      gameTimeRemaining: 15 * 60 // 15 minutes in seconds
    });
  } catch (error) {
    console.error('Register team error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Submit answer
const submitAnswer = async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    console.log('Submit answer - Request body:', req.body);
    console.log('Submit answer - Team:', req.team ? req.team.teamName : 'No team');
    
    await session.withTransaction(async () => {
      const { questionId, answer } = req.body;
      const team = req.team;

      console.log('Submit answer - questionId:', questionId, 'answer:', answer);

      if (!questionId || !answer) {
        console.log('Submit answer - Missing questionId or answer');
        throw new Error('Question ID and answer are required');
      }

      // Get fresh team data with lock
      const currentTeam = await Team.findById(team._id).session(session);
      
      // Temporarily disable question access restriction
      // if (questionId !== currentTeam.currentQuestion) {
      //   throw new Error('Invalid question access');
      // }

      const question = await Question.findOne({ questionId }).session(session);
      if (!question) {
        throw new Error('Question not found');
      }

      // Update attempts with timestamp
      const currentAttempts = currentTeam.attemptsPerQuestion.get(questionId.toString()) || 0;
      currentTeam.attemptsPerQuestion.set(questionId.toString(), currentAttempts + 1);
      
      // Add attempt timestamp for admin tracking
      const attemptKey = `${questionId}_attempts`;
      if (!currentTeam.attemptTimestamps) currentTeam.attemptTimestamps = new Map();
      const timestamps = currentTeam.attemptTimestamps.get(attemptKey) || [];
      timestamps.push(new Date());
      currentTeam.attemptTimestamps.set(attemptKey, timestamps);

      const isCorrect = answer.trim().toLowerCase() === question.answer.toLowerCase();

      if (isCorrect) {
        // Add completion timestamp
        const completionKey = `${questionId}_completed`;
        currentTeam.attemptTimestamps.set(completionKey, new Date());
        
        currentTeam.digitsUnlocked.push(question.digitValue);
        
        if (currentTeam.currentQuestion < 10) {
          currentTeam.currentQuestion += 1;
        }

        currentTeam.calculateScore();
        await currentTeam.save({ session });

        res.json({
          correct: true,
          digit: question.digitValue,
          nextQuestion: currentTeam.currentQuestion <= 10 ? currentTeam.currentQuestion : null,
          score: currentTeam.score,
          message: 'Correct answer! Digit unlocked.',
          timestamp: new Date()
        });
      } else {
        await currentTeam.save({ session });
        
        res.json({
          correct: false,
          attempts: currentTeam.attemptsPerQuestion.get(questionId.toString()),
          canUseHint: currentTeam.attemptsPerQuestion.get(questionId.toString()) >= 2,
          message: 'Incorrect answer. Try again!',
          timestamp: new Date()
        });
      }
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(400).json({ error: error.message || 'Server error' });
  } finally {
    session.endSession();
  }
};

// Use hint
const useHint = async (req, res) => {
  try {
    const { questionId } = req.body;
    const team = req.team;

    // Temporarily disable question access restriction
    // if (questionId !== team.currentQuestion) {
    //   return res.status(400).json({ error: 'Invalid question access' });
    // }

    const attempts = team.attemptsPerQuestion.get(questionId.toString()) || 0;
    if (attempts < 2) {
      return res.status(400).json({ error: 'Need at least 2 attempts before using hint' });
    }

    if (team.hintsUsed.get(questionId.toString())) {
      return res.status(400).json({ error: 'Hint already used for this question' });
    }

    const question = await Question.findOne({ questionId });
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Mark hint as used
    team.hintsUsed.set(questionId.toString(), true);
    team.calculateScore();
    await team.save();

    res.json({
      hint: question.hintText,
      score: team.score,
      message: 'Hint revealed! (-2 points)'
    });
  } catch (error) {
    console.error('Use hint error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Submit final code
const submitFinalCode = async (req, res) => {
  try {
    const { finalCode, finishEarly } = req.body;
    const team = req.team;

    console.log('Submit final code - Body:', req.body);
    console.log('Submit final code - Team:', team ? team.teamName : 'No team');
    console.log('Submit final code - finishEarly:', finishEarly);

    if (team.finished) {
      return res.status(400).json({ error: 'Game already completed' });
    }

    // Handle finish early
    if (finishEarly) {
      console.log('Processing finish early request');
      team.finished = true;
      team.endTime = new Date();
      team.finalTime = Math.floor((team.endTime - team.startTime) / 1000);
      team.calculateScore();
      await team.save();

      return res.json({
        success: true,
        message: 'Game finished early. Check leaderboard for your ranking.',
        finalTime: team.finalTime,
        score: team.score,
        questionsCompleted: team.digitsUnlocked.length
      });
    }

    if (team.digitsUnlocked.length !== 10) {
      console.log('Not all puzzles completed:', team.digitsUnlocked.length);
      return res.status(400).json({ error: 'All puzzles must be completed first' });
    }

    // The correct final code is: 7392518460 (fixed order)
    const correctCode = '7392518460';
    
    if (finalCode === correctCode) {
      team.finished = true;
      team.endTime = new Date();
      team.finalTime = Math.floor((team.endTime - team.startTime) / 1000); // in seconds
      team.calculateScore();
      await team.save();

      res.json({
        success: true,
        message: 'Congratulations! You have successfully escaped the Data Vault!',
        finalTime: team.finalTime,
        score: team.score
      });
    } else {
      res.json({
        success: false,
        message: 'Incorrect final code. Try again!'
      });
    }
  } catch (error) {
    console.error('Submit final code error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const teams = await Team.find({ finished: true })
      .select('teamName collegeName finalTime score endTime digitsUnlocked')
      .sort({ 
        digitsUnlocked: -1,  // Sort by questions completed (descending)
        finalTime: 1,        // Then by time (ascending)
        score: -1            // Then by score (descending)
      });

    const leaderboard = teams.map((team, index) => ({
      rank: index + 1,
      teamName: team.teamName,
      collegeName: team.collegeName,
      time: team.finalTime,
      score: team.score,
      questionsCompleted: team.digitsUnlocked.length,
      completedAt: team.endTime
    }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get team progress
const getTeamProgress = async (req, res) => {
  try {
    const team = req.team;
    
    res.json({
      teamName: team.teamName,
      collegeName: team.collegeName,
      currentQuestion: team.currentQuestion,
      digitsUnlocked: team.digitsUnlocked.length,
      score: team.score,
      startTime: team.startTime,
      finished: team.finished,
      finalTime: team.finalTime
    });
  } catch (error) {
    console.error('Get team progress error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Skip question
const skipQuestion = async (req, res) => {
  try {
    const { questionId } = req.body;
    const team = req.team;

    console.log(`Team ${team.teamName} skipping question ${questionId}`);

    // Move to next question without unlocking digit
    if (team.currentQuestion < 10) {
      team.currentQuestion += 1;
      await team.save();
    }

    res.json({
      success: true,
      nextQuestion: team.currentQuestion <= 10 ? team.currentQuestion : null,
      message: 'Question skipped. No digit unlocked.'
    });
  } catch (error) {
    console.error('Skip question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Finish game early
const finishEarly = async (req, res) => {
  try {
    const team = req.team;

    if (team.finished) {
      return res.status(400).json({ error: 'Game already completed' });
    }

    team.finished = true;
    team.endTime = new Date();
    team.finalTime = Math.floor((team.endTime - team.startTime) / 1000);
    team.calculateScore();
    await team.save();

    res.json({
      success: true,
      message: 'Game finished early. Check leaderboard for your ranking.',
      finalTime: team.finalTime,
      score: team.score,
      questionsCompleted: team.digitsUnlocked.length
    });
  } catch (error) {
    console.error('Finish early error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  registerTeam,
  submitAnswer,
  useHint,
  submitFinalCode,
  finishEarly,
  getLeaderboard,
  getTeamProgress,
  skipQuestion
};