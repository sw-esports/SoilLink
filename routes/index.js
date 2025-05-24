const express = require('express');
const router = express.Router();

// @route   GET /
// @desc    Home page
// @access  Public
router.get('/', (req, res) => {
  // Don't redirect authenticated users, let them view home page
  res.render('index', { 
    title: 'SoilLink - Quality Agricultural Soil Analysis'
  });
});

// @route   GET /about
// @desc    About page
// @access  Public
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'About Us - SoilLink'
  });
});

// @route   GET /contact
// @desc    Contact page
// @access  Public
router.get('/contact', (req, res) => {
  res.render('contact', { 
    title: 'Contact Us - SoilLink'
  });
});

module.exports = router;
