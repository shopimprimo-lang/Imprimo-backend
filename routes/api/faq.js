const express = require('express');
const router = express.Router();
const Faq = require('../../models/faq');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const { ROLES } = require('../../constants');

// GET all FAQs (public or admin)
router.get('/', async (req, res) => {
  try {
    const faqs = await Faq.find({}).sort({ displayOrder: 1, created: -1 });
    res.status(200).json({ faqs });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

// POST add FAQ
router.post('/add', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const { question, answer, displayOrder } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'You must provide a question and an answer.' });
    }

    const faq = new Faq({
      question,
      answer,
      displayOrder: displayOrder || 0
    });

    const savedFaq = await faq.save();

    res.status(200).json({
      success: true,
      message: 'FAQ has been added successfully!',
      faq: savedFaq
    });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

// DELETE FAQ
router.delete('/delete/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const faq = await Faq.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'FAQ has been deleted successfully!',
      faq
    });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

// PUT update FAQ
router.put('/:id', auth, role.check(ROLES.Admin), async (req, res) => {
  try {
    const faqId = req.params.id;
    const update = req.body.faq;

    await Faq.findOneAndUpdate({ _id: faqId }, update, { new: true });

    res.status(200).json({
      success: true,
      message: 'FAQ has been updated successfully!'
    });
  } catch (error) {
    res.status(400).json({ error: 'Your request could not be processed. Please try again.' });
  }
});

module.exports = router;
