const Mongoose = require('mongoose');
const { Schema } = Mongoose;

const BannerSchema = new Schema({
  desktopImage: {
    type: String,
    required: true,
  },
  mobileImage: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    trim: true,
  },
  subtitle: {
    type: String,
    trim: true,
  },
  ctaLabel: {
    type: String,
    trim: true,
  },
  ctaLink: {
    type: String,
    trim: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Mongoose.model('Banner', BannerSchema);
