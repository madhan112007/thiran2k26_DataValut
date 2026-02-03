const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  collegeName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  currentQuestion: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  digitsUnlocked: {
    type: [Number],
    default: []
  },
  attemptsPerQuestion: {
    type: Map,
    of: Number,
    default: new Map()
  },
  hintsUsed: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  attemptTimestamps: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: new Map()
  },
  score: {
    type: Number,
    default: 0
  },
  finished: {
    type: Boolean,
    default: false
  },
  finalTime: {
    type: Number,
    default: null
  },
  sessionToken: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Calculate score method
teamSchema.methods.calculateScore = function() {
  let totalScore = 0;
  
  // Base score for each completed question
  totalScore += this.digitsUnlocked.length * 10;
  
  // Deduct for hints used
  for (let [questionId, used] of this.hintsUsed) {
    if (used) totalScore -= 2;
  }
  
  // Deduct for extra attempts
  for (let [questionId, attempts] of this.attemptsPerQuestion) {
    if (attempts > 1) {
      totalScore -= (attempts - 1);
    }
  }
  
  this.score = Math.max(0, totalScore);
  return this.score;
};

module.exports = mongoose.model('Team', teamSchema);