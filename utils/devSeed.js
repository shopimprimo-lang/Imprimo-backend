// Seed data for the in-memory development database (see utils/db.js).
// Mirrors Imprimo-frontend/src/data/dummy.ts. Image paths are served from each
// app's own public/images/demo folder.
const Category = require('../models/category');
const Product = require('../models/product');
const Banner = require('../models/banner');
const User = require('../models/user');

const categories = [
  ['Personalized Gifts', 'personalized-gifts'],
  ['Printing', 'printing'],
  ['Packaging', 'packaging'],
  ['Invitations', 'invitations'],
  ['Corporate Gifts', 'corporate-gifts']
];

// DEVELOPMENT DEMO DATA ONLY — placeholder prices, not real Imprimo pricing.
// [name, category slug, description, price, stock, featured]
const products = [
  ['Personalized Photo Mug', 'personalized-gifts', 'Ceramic 11oz mug printed with your favourite photo or message. Dishwasher-safe, vibrant full-colour print.', 35, 120, true],
  ['Custom Photo Frame', 'personalized-gifts', 'Elegant tabletop frame with a custom-printed photo and optional engraved name or date.', 60, 60, true],
  ['Personalized Gift Box', 'packaging', 'Premium rigid gift box with a personalized lid print, ideal for occasions and hampers.', 120, 40, true],
  ['Custom Keychain', 'personalized-gifts', 'Durable acrylic or metal keychain with your photo, logo or initials.', 20, 300, false],
  ['Premium Business Cards', 'printing', 'Pack of 250 cards on 400gsm stock with matte or soft-touch lamination and optional gold foil.', 150, 500, true],
  ['Corporate Brochure', 'printing', 'A4 tri-fold or booklet brochures, full-colour print on premium art paper. Price per 100 copies.', 450, 100, false],
  ['Custom Gift Box', 'packaging', 'Branded gift box in your colours with custom insert — perfect for corporate and retail gifting.', 85, 80, true],
  ['Branded Carry Bag', 'packaging', 'Paper carry bag with rope handles, printed with your logo. Price per bag, minimum 100.', 15, 1000, false],
  ['Wedding Invitation', 'invitations', 'Luxury wedding invitation card with envelope, foil detailing and bilingual text on request.', 12, 800, true],
  ['Personalized Cushion', 'personalized-gifts', 'Soft 40×40cm cushion with a full-colour custom print on the front.', 55, 70, false],
  ['Photo Calendar', 'printing', '12-month wall or desk calendar featuring your own photos on every page.', 70, 90, false],
  ['Corporate Gift Set', 'corporate-gifts', 'Curated set with branded notebook, pen, bottle and card holder in a presentation box.', 250, 50, false]
];

module.exports = async () => {
  // DEMO login — in-memory development DB only (this file never runs with a real MONGO_URI).
  // ADMIN_EMAIL / ADMIN_PASSWORD in .env take precedence (see index.js).
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    await User.create({ email: 'admin@imprimo.local', password: 'ImprimoDemo@123', firstName: 'Demo', lastName: 'Admin', role: 'ROLE ADMIN' });
    console.log('Demo admin: admin@imprimo.local / ImprimoDemo@123 (development only)');
  }

  if (await Product.countDocuments()) return;

  const cats = {};
  for (const [name, slug] of categories) {
    cats[slug] = await Category.create({ name, image: `/images/demo/category-${slug}.jpg` });
  }

  for (const [i, [name, slug, description, price, stock, featured]] of products.entries()) {
    const product = await Product.create({
      name,
      description,
      category: cats[slug]._id,
      featured,
      variants: [{ name: 'Standard', color: 'Standard', price, stock, images: [`/images/demo/product-${i + 1}.jpg`], isDefault: true }]
    });
    await Category.updateOne({ _id: cats[slug]._id }, { $push: { products: product._id } });
  }

  await Banner.create({
    title: 'Imprimo Trading — Premium Printing & Personalized Gifts',
    desktopImage: '/images/demo/hero-desktop.jpg',
    mobileImage: '/images/demo/hero-mobile.jpg',
    displayOrder: 1
  });

  console.log(`Seeded dev data: ${categories.length} categories, ${products.length} products, 1 banner.`);
};
