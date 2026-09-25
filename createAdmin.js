const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const User = require('./models/user');
const { ROLES } = require('./constants');

const { MONGO_URI, ADMIN_EMAIL: adminEmail, ADMIN_PASSWORD: adminPassword } = process.env;

const seedAdmin = async () => {
  try {
    if (!adminEmail || !adminPassword) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists');
      existingAdmin.role = ROLES.Admin;
      await existingAdmin.save();
      process.exit(0);
    }

    const adminUser = new User({
      email: adminEmail,
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: ROLES.Admin
    });

    await adminUser.save();

    console.log('Admin created');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
seedAdmin();
