require('./utils/maskWarnings'); // before mongoose connects: keeps the DB password out of warnings
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const User = require('./models/user');
const { ROLES } = require('./constants');

const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

const updateAdmin = async () => {
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const existingAdmin = await User.findOne({ role: ROLES.Admin });

    if (existingAdmin) {
      existingAdmin.email = ADMIN_EMAIL;
      existingAdmin.password = ADMIN_PASSWORD;
      await existingAdmin.save();
      console.log(`Admin updated to email: ${ADMIN_EMAIL}`);
    } else {
      const adminUser = new User({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        firstName: 'Super',
        lastName: 'Admin',
        role: ROLES.Admin
      });
      await adminUser.save();
      console.log(`Admin created with email: ${ADMIN_EMAIL}`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
updateAdmin();
