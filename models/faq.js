const Mongoose = require('mongoose');
const { Schema } = Mongoose;

const FaqSchema = new Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

module.exports = Mongoose.model('Faq', FaqSchema);
