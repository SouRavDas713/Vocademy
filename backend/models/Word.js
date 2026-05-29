const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  pronunciation: {
    type: String,
    trim: true,
    default: ''
  },
  meaning: {
    type: String,
    trim: true,
    default: ''
  },
  banglaMeaning: {
    type: String,
    trim: true,
    index: true,
    default: ''
  },
  exampleSentence: {
    type: String,
    trim: true,
    default: ''
  },
  synonyms: [{
    type: String,
    trim: true
  }],
  antonyms: [{
    type: String,
    trim: true
  }],
  addedByEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Text index for regex search fallback on available text properties
wordSchema.index({ word: 'text', meaning: 'text', banglaMeaning: 'text' });

module.exports = mongoose.model('Word', wordSchema);
