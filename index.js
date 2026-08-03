require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const cors = require('cors');
const helmet = require('helmet');

const keys = require('./config/keys');
const routes = require('./routes');
const { setupDB } = require('./utils/db'); // Force nodemon restart to load new env

const { port } = keys;
const app = express();

app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' }));
app.use(
  helmet({
    contentSecurityPolicy: false,
    frameguard: true
  })
);
app.use(cors());

setupDB().then(async () => {
  const User = require('./models/user');
  const bcrypt = require('bcryptjs');
  const adminEmail = 'printiqo@gmail.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = new User({ email: adminEmail, password: 'printiqo', firstName: 'Super', lastName: 'Admin', role: 'ROLE ADMIN' });
    await admin.save();
    console.log('Admin user seeded automatically.');
  } else {
    admin.role = 'ROLE ADMIN';
    admin.password = 'printiqo';
    await admin.save();
    console.log('Admin user password forcefully updated to printiqo.');
  }

  // Automatic variant migration: Copy legacy color field values into variant name
  try {
    const Product = require('./models/product');
    const products = await Product.find({});
    let totalMigrated = 0;
    for (const p of products) {
      let changed = false;
      if (p.variants && Array.isArray(p.variants)) {
        p.variants.forEach(v => {
          if (v.color && !v.name) {
            v.name = v.color;
            changed = true;
          }
        });
      }
      if (changed) {
        await p.save();
        totalMigrated++;
      }
    }
    if (totalMigrated > 0) {
      console.log(`Migrated ${totalMigrated} products from color to variant name.`);
    }
  } catch (err) {
    console.error('Error running color-to-name migration:', err);
  }
});
require('./config/passport')(app);
app.use(routes);

const server = app.listen(port, () => {
  console.log(
    `${chalk.green('✓')} ${chalk.blue(
      `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
    )}`
  );
});
