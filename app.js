const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const ejsLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Load environment variables first
dotenv.config();

// Import utilities
const logger = require('./utils/logger');
const { connectDatabase, monitorPerformance, scheduleMaintenanceTasks } = require('./utils/database');
const { sanitizeRequestBody } = require('./utils/validation');

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables:', missingEnvVars.join(', '));
  process.exit(1);
}

// Import routes
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const dashboardRoutes = require('./routes/dashboard');
const healthRoutes = require('./routes/health');

// Import middleware
const { checkAuth } = require('./middleware/auth');
const { authLimiter, requestLogger, securityHeaders } = require('./middleware/production');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "blob:"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      manifestSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression());

// Production security and logging middleware
app.use(securityHeaders);
if (process.env.NODE_ENV === 'production') {
  app.use(requestLogger);
}

// Rate limiting (skip for static assets and PWA files)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  skip: (req, res) => {
    // Skip rate limiting for static files and PWA-related files
    return req.path.startsWith('/js/') || 
           req.path.startsWith('/css/') || 
           req.path.startsWith('/src/') ||
           req.path.includes('manifest.json') ||
           req.path.includes('service-worker.js') ||
           req.path.includes('favicon.ico');
  }
});
app.use(limiter);

// Connect to MongoDB with optimizations
connectDatabase();
monitorPerformance();
scheduleMaintenanceTasks();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// Input sanitization
app.use(sanitizeRequestBody);

// Cookie parser for JWT tokens
app.use(cookieParser());

// Global middleware to set user data for templates (JWT only)
app.use((req, res, next) => {
  // Set user data for template rendering from JWT token
  const token = req.cookies.token;
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.locals.user = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role
      };
      logger.info(`Global middleware: User ${decoded.id} authenticated via token`);
    } catch (err) {
      // Invalid token, clear cookie and set user to null
      res.clearCookie('token');
      res.locals.user = null;
      logger.warn('Global middleware: Invalid token found, cleared cookie');
    }
  } else {
    res.locals.user = null;
  }
  
  // Set current path for active menu highlighting
  res.locals.path = req.path;
    next();
});

// Set view engine
app.use(ejsLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Static files with caching for PWA
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1y' : '0',
  etag: true,
  setHeaders: (res, path) => {
    // Set proper MIME types for PWA files
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.json')) {
      res.setHeader('Content-Type', 'application/json');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
    
    // Set caching headers for PWA-specific files
    if (path.endsWith('manifest.json')) {
      res.setHeader('Cache-Control', 'public, max-age=0');
    } else if (path.endsWith('service-worker.js')) {
      // No caching for service worker - always get latest version
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (path.includes('/src/images/icon-')) {
      // Long cache for icons
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));

// PWA specific route
app.get('/offline', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'offline.html'));
});

// Routes
app.use('/api/health', healthRoutes);

// Debug route to check authentication state
app.get('/debug/auth', (req, res) => {
  res.json({
    user: res.locals.user,
    cookies: req.cookies,
    hasToken: !!req.cookies.token,
    isAuthenticated: !!res.locals.user
  });
});

app.use('/', indexRoutes);
app.use('/auth', authLimiter, authRoutes);

// Set up dashboard routes with no caching
app.use('/dashboard', checkAuth, (req, res, next) => {
  // Complete cache prevention for all dashboard routes
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '-1');
  next();
}, dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  
  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
  
  res.status(500).render('500', { 
    title: '500 - Server Error',
    message: message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
