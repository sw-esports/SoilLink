const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { 
  userRegistrationValidation, 
  userLoginValidation, 
  handleValidationErrors 
} = require('../utils/validation');

// @route   GET /auth/register
// @desc    Show registration form
// @access  Public
router.get('/register', (req, res) => {
  res.render('auth/register', { 
    title: 'Register - SoilLink'
  });
});

// @route   POST /auth/register
// @desc    Register new user
// @access  Public
router.post('/register', userRegistrationValidation, handleValidationErrors, async (req, res) => {
  try {
    // Check if request is AJAX
    const isAjax = req.xhr || req.headers.accept?.includes('application/json');
    
    const { name, email, password } = req.body;    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (isAjax) {
        return res.status(400).json({ 
          success: false,
          error: 'Email is already registered',
          errors: [{ field: 'email', message: 'Email is already registered' }]
        });
      }
      return res.status(400).render('auth/register', {
        title: 'Register - SoilLink',
        name,
        email,
        error_msg: 'Email is already registered'
      });
    }

    // Create new user
    const newUser = new User({
      name,
      email,
      password
    });
    
    await newUser.save();
    logger.info(`New user registered: ${email}`);    if (isAjax) {
      return res.json({ 
        success: true, 
        message: 'You are now registered and can log in', 
        redirectUrl: '/auth/login' 
      });
    }
    res.redirect('/auth/login');
  } catch (err) {
    logger.error('Registration error:', err);    if (isAjax) {
      return res.status(500).json({ 
        success: false,
        error: 'An error occurred during registration',
        message: 'Server error, please try again later' 
      });
    }
    res.status(500).render('auth/register', {
      title: 'Register - SoilLink',
      error_msg: 'An error occurred during registration'
    });
  }
});

// @route   GET /auth/login
// @desc    Show login form
// @access  Public
router.get('/login', (req, res) => {
  res.render('auth/login', { 
    title: 'Login - SoilLink'
  });
});

// @route   POST /auth/login
// @desc    Login user
// @access  Public
router.post('/login', userLoginValidation, handleValidationErrors, async (req, res) => {
  try {
    // Check if request is AJAX
    const isAjax = req.xhr || req.headers.accept?.includes('application/json') || req.headers['x-requested-with'] === 'XMLHttpRequest';
    
    logger.info('Login attempt:', { 
      email: req.body.email, 
      isAjax,
      headers: req.headers
    });
    
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      if (isAjax) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email or password',
          errors: [{ field: 'email', message: 'Invalid email or password' }]
        });      }      return res.status(400).render('auth/login', {
        title: 'Login - SoilLink',
        email,
        error_msg: 'Invalid email or password'
      });
    }    
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      if (isAjax) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid email or password',
          errors: [{ field: 'password', message: 'Invalid email or password' }]
        });      }
      return res.status(400).render('auth/login', {
        title: 'Login - SoilLink',
        email,
        error_msg: 'Invalid email or password'
      });
    }    // Create JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    logger.info('Login successful:', { userId: user._id, email: user.email });

    if (isAjax) {
      logger.info('Sending AJAX login success response', {
        userId: user._id,
        redirectUrl: `/dashboard/${user._id}`
      });
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          name: user.name,
          role: user.role
        },
        redirectUrl: `/dashboard/${user._id}`
      });    } else {
      return res.redirect(`/dashboard/${user._id}`);
    }
  } catch (err) {
    logger.error('Login error:', err);
    // Note: isAjax is already defined at the beginning of the route
    if (isAjax) {
      return res.status(500).json({ 
        success: false,
        error: 'An error occurred during login',
        message: 'Server error, please try again later'
      });    }    res.status(500).render('auth/login', {
      title: 'Login - SoilLink',
      error_msg: 'An error occurred during login'
    });
  }
});

// @route   GET /auth/logout
// @desc    Logout user
// @access  Private
router.get('/logout', (req, res) => {
  // Check if request is AJAX
  const isAjax = req.xhr || req.headers.accept?.includes('application/json');
  
  // Clear token cookie
  res.clearCookie('token');
  
  if (isAjax) {
    return res.json({ 
      success: true, 
      message: 'Logged out successfully',
      redirectUrl: '/' 
    });
  }
  res.redirect('/');
});

module.exports = router;
