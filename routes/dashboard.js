const express = require('express');
const router = express.Router();
const User = require('../models/User');
const logger = require('../utils/logger');

// Middleware to verify user ID matches the logged-in user
const verifyUserAccess = (req, res, next) => {
  const { uid } = req.params;
  if (req.user.id !== uid && req.user.role !== 'admin') {
    return res.redirect(`/dashboard/${req.user.id}`);
  }
  next();
};

// @route   GET /dashboard/:uid/reports
// @desc    Reports page
// @access  Private
router.get('/:uid/reports', verifyUserAccess, async (req, res) => {  try {
    const user = await User.findById(req.params.uid).select('-password');
    if (!user) {
      return res.redirect('/');    }    res.render('dashboard/reports', {
      title: 'Report History - SoilLink',
      profileUser: user
    });
  } catch (err) {
    logger.error('Dashboard reports error:', err);
    res.redirect('/');
  }
});

// @route   GET /dashboard/:uid
// @desc    Dashboard Home
// @access  Private
router.get('/:uid', verifyUserAccess, async (req, res) => {
  try {
    const user = await User.findById(req.params.uid).select('-password');
    
    if (!user) {
      return res.redirect('/');
    }
    
    res.render('dashboard/index', { 
      title: 'Dashboard - SoilLink',
      profileUser: user    });
  } catch (err) {
    logger.error('Dashboard index error:', err);
    res.redirect('/');
  }
});

// @route   GET /dashboard/:uid/profile
// @desc    User profile
// @access  Private
router.get('/:uid/profile', verifyUserAccess, async (req, res) => {  try {
    const user = await User.findById(req.params.uid).select('-password');
    
    if (!user) {
      return res.redirect('/');
    }
    
    res.render('dashboard/profile', { 
      title: 'My Profile - SoilLink',
      profileUser: user    });
  } catch (err) {
    logger.error('Dashboard profile error:', err);
    res.redirect(`/dashboard/${req.params.uid}`);
  }
});

// @route   GET /dashboard/:uid/soil-analysis
// @desc    Soil analysis page
// @access  Private
router.get('/:uid/soil-analysis', verifyUserAccess, (req, res) => {
  res.render('dashboard/soil-analysis', { 
    title: 'Soil Analysis - SoilLink',
    uid: req.params.uid
  });
});

// @route   POST /dashboard/:uid/soil-analysis
// @desc    Submit soil analysis
// @access  Private
router.post('/:uid/soil-analysis', verifyUserAccess, (req, res) => {
  // Here you would process the soil analysis data
  // For now just redirect back with a success message
  res.redirect(`/dashboard/${req.params.uid}/soil-analysis`);
});

module.exports = router;
