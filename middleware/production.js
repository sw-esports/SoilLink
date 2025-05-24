const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Enhanced rate limiting for production
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, path: ${req.path}`);
      res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Stricter rate limiting for auth routes
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'Too many authentication attempts, please try again later.' }
});

// API rate limiter
const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'API rate limit exceeded.' }
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Error Response', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

module.exports = {
  createRateLimiter,
  authLimiter,
  apiLimiter,
  requestLogger,
  securityHeaders
};
