const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Soil = require('../models/Soil');
const { getMultipleTips } = require('../utils/soilTips');
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
router.get('/:uid/reports', verifyUserAccess, async (req, res) => { 
  try {
    // Apply no-cache headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  
    const user = await User.findById(req.params.uid).select('-password').lean().exec();
    const soilSamples = await Soil.find({ userId: req.params.uid })
                                .sort({ submittedAt: -1 })
                                .lean()
                                .exec();
    
    if (!user) {
      return res.redirect('/');
    }
    
    console.log(`Found ${soilSamples.length} soil samples for user ${req.params.uid}`);
    
    res.render('dashboard/reports', {
      title: 'Report History - SoilLink',
      profileUser: user,
      soilSamples
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
    // Apply strong no-cache headers
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // Force MongoDB to fetch fresh data (no cache)
    const user = await User.findById(req.params.uid)
                        .select('-password')
                        .lean()
                        .exec();
    
    if (!user) {
      return res.redirect('/');
    }
    
    // Force MongoDB to fetch fresh data (no cache) and use lean queries for performance
    const soilSamples = await Soil.find({ userId: req.params.uid })
                              .sort({ submittedAt: -1 })
                              .limit(5)
                              .lean()
                              .exec();
      // Get total number of soil samples (no limit)
    const totalSamples = await Soil.countDocuments({ userId: req.params.uid });
    
    // Get latest metrics from most recent sample instead of averages
    let latestMetrics = {
      phLevel: "N/A",
      waterLevel: "0.0",
      soilHealth: "0.0",
      nitrogenLevel: "0.0",
      phosphorusLevel: "0.0",
      potassiumLevel: "0.0",
      recentDate: null,
      sampleCount: totalSamples
    };
    
    if (soilSamples.length > 0) {
      // Use the most recent sample for metrics
      const latestSample = soilSamples[0];
      
      latestMetrics = {
        phLevel: latestSample.phLevel.toFixed(1),
        waterLevel: latestSample.waterLevel.toFixed(1),
        soilHealth: latestSample.soilHealth.toFixed(1),
        nitrogenLevel: latestSample.nitrogenLevel.toFixed(1),
        phosphorusLevel: latestSample.phosphorusLevel.toFixed(1),
        potassiumLevel: latestSample.potassiumLevel.toFixed(1),
        recentDate: latestSample.submittedAt.toISOString().split('T')[0],
        sampleCount: totalSamples
      };
    }
      // Get random soil tips
    const tips = getMultipleTips(3);
    
    res.render('dashboard/index', { 
      title: 'Dashboard - SoilLink',
      profileUser: user,
      soilSamples,
      avgMetrics: latestMetrics, // Keep variable name for compatibility
      tips
    });
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
// @desc    Soil Analysis page
// @access  Private
router.get('/:uid/soil-analysis', verifyUserAccess, async (req, res) => {
  try {
    const user = await User.findById(req.params.uid).select('-password');
    const soilSamples = await Soil.find({ userId: req.params.uid })
                                .sort({ submittedAt: -1 })
                                .limit(10);
    
    if (!user) {
      return res.redirect('/');
    }
    
    res.render('dashboard/soil-analysis', {
      title: 'Soil Analysis - SoilLink',
      profileUser: user,
      soilSamples
    });
  } catch (err) {
    logger.error('Soil analysis page error:', err);
    res.redirect('/');
  }
});

// @route   GET /dashboard/:uid/soil/:soilId
// @desc    View single soil sample
// @access  Private
router.get('/:uid/soil/:soilId', verifyUserAccess, async (req, res) => {
  try {
    const user = await User.findById(req.params.uid).select('-password');
    const soil = await Soil.findOne({
      _id: req.params.soilId,
      userId: req.params.uid
    });
    
    if (!user || !soil) {
      return res.redirect('/');
    }
    
    // Get 3 random tips
    const tips = getMultipleTips(3);
    
    res.render('dashboard/soil-sample', {
      title: `${soil.name} - Soil Analysis - SoilLink`,
      profileUser: user,
      soil,
      tips
    });
  } catch (err) {
    logger.error('Soil sample view error:', err);
    res.redirect('/');
  }
});

// @route   GET /dashboard/:uid/soil/:soilId/data
// @desc    Get soil sample data in JSON format
// @access  Private
router.get('/:uid/soil/:soilId/data', verifyUserAccess, async (req, res) => {
  try {
    const soil = await Soil.findOne({
      _id: req.params.soilId,
      userId: req.params.uid
    });
    
    if (!soil) {
      return res.status(404).json({ success: false, message: 'Soil sample not found' });
    }
    
    // Return only the data needed for dashboard updates
    res.json({
      success: true,
      soil: {
        id: soil._id,
        name: soil.name,
        phLevel: soil.phLevel,
        waterLevel: soil.waterLevel,
        soilHealth: soil.soilHealth,
        nitrogenLevel: soil.nitrogenLevel,
        phosphorusLevel: soil.phosphorusLevel,
        potassiumLevel: soil.potassiumLevel,
        submittedAt: soil.submittedAt
      }
    });
  } catch (err) {
    logger.error('Soil data fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /dashboard/:uid/soil-analysis
// @desc    Submit a new soil sample
// @access  Private
router.post('/:uid/soil-analysis', verifyUserAccess, async (req, res) => {
  try {
    console.log('POST soil-analysis request received for user ID:', req.params.uid);
    console.log('Request body:', req.body);
    
    const { sampleName, location, notes } = req.body;
    
    if (!sampleName) {
      console.error('Missing required field: sampleName');
      return res.status(400).json({ success: false, message: 'Sample name is required' });
    }
    
    // Generate random soil data
    const phLevel = +(Math.random() * (8.5 - 5.5) + 5.5).toFixed(1);
    const waterLevel = +(Math.random() * 100).toFixed(1);
    const nitrogenLevel = +(Math.random() * 100).toFixed(1);
    const phosphorusLevel = +(Math.random() * 100).toFixed(1);
    const potassiumLevel = +(Math.random() * 100).toFixed(1);
    const soilHealth = +(Math.random() * 100).toFixed(1);
    
    // Create new soil sample
    const newSoil = new Soil({
      name: sampleName,
      userId: req.params.uid,
      phLevel,
      waterLevel,
      soilHealth,
      nitrogenLevel,
      phosphorusLevel,
      potassiumLevel,
      notes,
      location
    });
      try {
      // Save the soil sample
      const savedSoil = await newSoil.save();
      console.log('Soil sample saved successfully:', savedSoil._id);
      
      // Update user's soil samples array
      const updatedUser = await User.findByIdAndUpdate(
        req.params.uid, 
        { $push: { soilSamples: savedSoil._id } },
        { new: true } // Return the updated document
      );
      
      console.log('User updated, now has', updatedUser.soilSamples.length, 'soil samples');
      
      // Apply strong no-cache headers
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      
      res.json({ 
        success: true, 
        soilId: savedSoil._id,
        timestamp: new Date().getTime(), // Add timestamp for cache busting
        totalSamples: updatedUser.soilSamples.length
      });
    } catch (saveError) {
      console.error('Error saving soil sample:', saveError);
      throw saveError;
    }
  } catch (err) {
    logger.error('Soil submission error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit soil sample' });
  }
});

module.exports = router;
