const router = require('express').Router();
const { dbState } = require('../utils/db');

const apiRoutes = require('./api');

// Public health checks. Report state only — never connection strings, hosts or error text.
const health = (req, res) => {
  res.status(dbState.connected ? 200 : 503).json({
    success: dbState.connected,
    status: dbState.connected ? 'ok' : 'degraded',
    message: 'Imprimo Trading backend is running',
    database: dbState.connected ? 'connected' : 'disconnected',
    imageStorage: require('../config/cloudinary').isConfigured ? 'cloudinary' : 'local',
    time: new Date().toISOString()
  });
};
router.get('/', health);
router.get('/status', health);

router.use('/api', apiRoutes);

module.exports = router;

