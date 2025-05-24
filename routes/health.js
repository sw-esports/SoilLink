const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const logger = require('../utils/logger');
const packageJson = require('../package.json');

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: packageJson.version,
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100
      }
    };

    // Check database connection
    if (mongoose.connection.readyState === 1) {
      healthCheck.database = 'Connected';
    } else {
      healthCheck.database = 'Disconnected';
      healthCheck.status = 'WARNING';
    }

    // Log health check for monitoring
    if (healthCheck.status !== 'OK') {
      logger.warn('Health check warning:', healthCheck);
    }

    res.status(healthCheck.status === 'OK' ? 200 : 503).json(healthCheck);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Ready check endpoint
router.get('/ready', async (req, res) => {
  try {
    // Check if all critical services are ready
    const isDbReady = mongoose.connection.readyState === 1;
    
    if (isDbReady) {
      res.status(200).json({ status: 'Ready' });
    } else {
      res.status(503).json({ status: 'Not Ready', reason: 'Database not connected' });
    }
  } catch (error) {
    logger.error('Ready check error:', error);
    res.status(503).json({ status: 'Not Ready', error: error.message });
  }
});

// Metrics endpoint (basic)
router.get('/metrics', (req, res) => {
  try {
    const metrics = {
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version
      },
      system: {
        loadavg: require('os').loadavg(),
        totalmem: require('os').totalmem(),
        freemem: require('os').freemem(),
        platform: require('os').platform(),
        arch: require('os').arch()
      }
    };

    res.json(metrics);
  } catch (error) {
    logger.error('Metrics error:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

module.exports = router;
