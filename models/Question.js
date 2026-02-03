const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 10
  },
  questionText: {
    type: String,
    required: true
  },
  dataset: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  hintText: {
    type: String,
    required: true
  },
  learnContent: {
    type: String,
    required: true
  },
  digitValue: {
    type: Number,
    required: true,
    min: 0,
    max: 9
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Question', questionSchema);