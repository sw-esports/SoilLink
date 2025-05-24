const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to check if user is authenticated (JWT only)
exports.checkAuth = (req, res, next) => {
  const logger = require('../utils/logger');
  const token = req.cookies.token;
    if (!token) {
    logger.warn('No token found in cookies');
    return res.redirect('/auth/login');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.info(`User ${decoded.id} authenticated via token`);
    next();  } catch (err) {
    logger.error('Invalid token:', err);
    res.clearCookie('token');
    res.redirect('/auth/login');
  }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  res.redirect(`/dashboard/${req.user.id}`);
};
