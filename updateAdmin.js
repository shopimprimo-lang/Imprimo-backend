const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const User = require('./models/user');
const { ROLES } = require('./constants');

const MONGO_URI = process.env.MONGO_URI;

const updateAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    const existingAdmin = await User.findOne({ role: ROLES.Admin });

    if (existingAdmin) {
      existingAdmin.email = 'printiqo@gmail.com';
      existingAdmin.password = 'printiqo';
      await existingAdmin.save();
      console.log('Admin updated to email: printiqo@gmail.com and password: printiqo');
    } else {
      const adminUser = new User({
        email: 'printiqo@gmail.com',
        password: 'printiqo',
        firstName: 'Super',
        lastName: 'Admin',
        role: ROLES.Admin
      });
      await adminUser.save();
      console.log('Admin created with email: printiqo@gmail.com and password: printiqo');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};
updateAdmin();
