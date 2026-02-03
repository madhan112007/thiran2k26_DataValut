const Question = require('../models/Question');

// Get question by ID
const getQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const team = req.team;

    console.log(`Team ${team.teamName} requesting question ${id}, current question: ${team.currentQuestion}`);

    const question = await Question.findOne({ questionId: parseInt(id) })
      .select('-answer'); // Don't send the answer to frontend

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const attempts = team.attemptsPerQuestion.get(id) || 0;
    const hintUsed = team.hintsUsed.get(id) || false;

    res.json({
      questionId: question.questionId,
      questionText: question.questionText,
      dataset: question.dataset,
      learnContent: question.learnContent,
      attempts,
      canUseHint: attempts >= 2,
      hintUsed,
      hintText: hintUsed ? question.hintText : null
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getQuestion
};