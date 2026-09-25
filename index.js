require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const keys = require('./config/keys');
const routes = require('./routes');
const { setupDB, dbState } = require('./utils/db'); // Force nodemon restart to load new env

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
// CORS: only the Imprimo sites may call the API from a browser. Auth uses the
// Authorization header (no cookies), so credentials are not enabled.
// Requests without an Origin header (server-side rendering, curl, health checks) are allowed.
const allowedOrigins = new Set([
  'https://imprimo-frontend.vercel.app',
  'https://imprimo-admin.vercel.app',
  ...(keys.app.clientURL ? [keys.app.clientURL.replace(/\/+$/, '')] : []),
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000', 'http://localhost:3001'])
]);
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowedOrigins.has(origin)),
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400
  })
);

setupDB().then(async () => {
  const User = require('./models/user');
  const bcrypt = require('bcryptjs');
  // Seed the admin account from env — never hardcode credentials.
  // In-memory dev DB: create or refresh it. Real DB (MONGO_URI): create only if missing,
  // never modify existing users, and never with the published demo password.
  const { ADMIN_EMAIL: adminEmail, ADMIN_PASSWORD: adminPassword } = process.env;
  const realDB = dbState.connected && !dbState.inMemory;
  if (realDB && adminPassword === 'ImprimoDemo@123') {
    console.warn('Skipping admin seed: ADMIN_PASSWORD is the demo password. Set a strong one in .env for a real database.');
  } else if (adminEmail && adminPassword) {
    let admin = await User.findOne({ email: adminEmail });
    if (admin && realDB) {
      console.log('Admin user exists — left unchanged (real database).');
    } else if (!admin) {
      admin = new User({ email: adminEmail, password: adminPassword, firstName: 'Super', lastName: 'Admin', role: 'ROLE ADMIN' });
      await admin.save();
      console.log('Admin user seeded automatically.');
    } else {
      admin.role = 'ROLE ADMIN';
      admin.password = adminPassword;
      await admin.save();
      console.log('Admin user password updated from ADMIN_PASSWORD.');
    }
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
// Locally stored image uploads (see config/cloudinary.js uploadImage).
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d', immutable: true }));
app.use(routes);

// API clients always get JSON, never Express's default HTML 404 page.
app.use((req, res) => res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.path}` }));

// `node index.js` (local, Docker, Render…) listens; serverless hosts (Vercel) import the app.
if (require.main === module) {
  app.listen(port, () => {
    console.log(
      `${chalk.green('✓')} ${chalk.blue(
        `Listening on port ${port}. Visit http://localhost:${port}/ in your browser.`
      )}`
    );
  });
}

module.exports = app;
