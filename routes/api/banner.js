const express = require('express');
const router = express.Router();
const Banner = require('../../models/banner');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');
const cloudinary = require('../../config/cloudinary');

// GET all banners (public or admin)
router.get('/', async (req, res) => {
  try {
    const banners = await Banner.find({});
    res.status(200).json({ banners });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

// Fields an admin may set; anything else in the body is ignored.
const FIELDS = ['desktopImage', 'mobileImage', 'title', 'subtitle', 'ctaLabel', 'ctaLink', 'displayOrder', 'isActive'];
const pick = body => Object.fromEntries(FIELDS.filter(k => body && body[k] !== undefined).map(k => [k, body[k]]));

const fail = (res, error) => {
  console.error('Banner error:', error);
  res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
};

// POST add banner
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const data = pick(req.body);
    if (!data.desktopImage || !data.mobileImage) {
      return res.status(400).json({ error: 'You must provide both desktop and mobile images.' });
    }
    data.desktopImage = await cloudinary.uploadImage(data.desktopImage, 'banners/desktop');
    data.mobileImage = await cloudinary.uploadImage(data.mobileImage, 'banners/mobile');

    const banner = await new Banner(data).save();
    res.status(200).json({ success: true, message: 'Banner has been added successfully!', banner });
  } catch (error) {
    fail(res, error);
  }
});

// DELETE banner
router.delete('/delete/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const banner = await Banner.deleteOne({ _id: req.params.id });
    res.status(200).json({ success: true, message: 'Banner has been deleted successfully!', banner });
  } catch (error) {
    fail(res, error);
  }
});

// PUT update banner (images, details or isActive). Body: { banner: {...} }
router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const update = pick(req.body.banner);
    if (update.desktopImage) update.desktopImage = await cloudinary.uploadImage(update.desktopImage, 'banners/desktop');
    if (update.mobileImage) update.mobileImage = await cloudinary.uploadImage(update.mobileImage, 'banners/mobile');

    const banner = await Banner.findOneAndUpdate({ _id: req.params.id }, update, { new: true, runValidators: true });
    if (!banner) return res.status(404).json({ error: 'Banner not found.' });

    res.status(200).json({ success: true, message: 'Banner has been updated successfully!', banner });
  } catch (error) {
    fail(res, error);
  }
});

module.exports = router;
