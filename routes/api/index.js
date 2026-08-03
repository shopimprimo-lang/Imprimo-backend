const router = require('express').Router();

const authRoutes = require('./auth');
const productRoutes = require('./product');
const categoryRoutes = require('./category');
const facilityRoutes = require('./facility');

const bannerRoutes = require('./banner');

// auth routes
router.use('/auth', authRoutes);

// // user routes
// router.use('/user', userRoutes);

// // address routes
// router.use('/address', addressRoutes);

// newsletter routes
// router.use('/newsletter', newsletterRoutes);

// product routes
router.use('/product', productRoutes);

// category routes
router.use('/category', categoryRoutes);

// facility routes
router.use('/facility', facilityRoutes);

// brand routes
// router.use('/brand', brandRoutes);

// // contact routes
// router.use('/contact', contactRoutes);

// // merchant routes
// router.use('/merchant', merchantRoutes);

// // cart routes
// router.use('/cart', cartRoutes);

// order routes
// router.use('/order', orderRoutes);

// Review routes
const reviewRoutes = require('./review');
router.use('/review', reviewRoutes);

// FAQ routes
const faqRoutes = require('./faq');
router.use('/faq', faqRoutes);

// Banner routes
router.use('/banner', bannerRoutes);

module.exports = router;
