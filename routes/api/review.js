const express = require('express');
const router = express.Router();
const Review = require('../../models/review');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');
const cloudinary = require('../../config/cloudinary');

// GET all reviews (public or admin)
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find({}).sort({ created: -1 });
    res.status(200).json({ reviews });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

// POST add review
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const { name, role: userRole, comment, rating, avatar } = req.body;

    if (!name || !comment) {
      return res.status(400).json({ error: 'You must provide a name and a comment.' });
    }

    let avatarUrl = '';
    if (avatar && avatar.startsWith('data:image')) {
      avatarUrl = await cloudinary.uploadImage(avatar, 'reviews');
    } else if (avatar) {
      avatarUrl = avatar;
    }

    const review = new Review({
      name,
      role: userRole,
      comment,
      rating,
      avatar: avatarUrl
    });

    const savedReview = await review.save();

    res.status(200).json({
      success: true,
      message: 'Review has been added successfully!',
      review: savedReview
    });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

// DELETE review
router.delete('/delete/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const review = await Review.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Review has been deleted successfully!',
      review
    });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

// PUT update review
router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const reviewId = req.params.id;
    const update = req.body.review;

    if (update.avatar && update.avatar.startsWith('data:image')) {
      update.avatar = await cloudinary.uploadImage(update.avatar, 'reviews');
    }

    await Review.findOneAndUpdate({ _id: reviewId }, update, { new: true });

    res.status(200).json({
      success: true,
      message: 'Review has been updated successfully!'
    });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

module.exports = router;
