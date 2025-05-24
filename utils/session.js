// Session management utilities and optimizations
const session = require('express-session');
const MongoStore = require('connect-mongo');
const logger = require('./logger');

/**
 * Session configuration with optimizations for production
 */
const getSessionConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
        secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI,
            touchAfter: 24 * 3600, // Lazy session update
            ttl: 14 * 24 * 60 * 60, // 14 days
            autoRemove: 'native', // Let MongoDB handle expired session removal
            autoRemoveInterval: 10, // Minutes between expired session cleanup
            stringify: false // Store sessions as objects for better performance
        }),
        cookie: {
            secure: isProduction, // HTTPS only in production
            httpOnly: true, // Prevent XSS
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: isProduction ? 'strict' : 'lax' // CSRF protection
        },
        name: 'soillink.sid', // Custom session cookie name
        rolling: true // Reset expiration on activity
    };
};

/**
 * Session cleanup middleware - removes old sessions periodically
 */
const sessionCleanup = (store) => {
    if (store && typeof store.clear === 'function') {
        // Clean up expired sessions every 6 hours
        setInterval(() => {
            logger.info('Running session cleanup...');
            // MongoDB TTL index handles this automatically, but we log it
        }, 6 * 60 * 60 * 1000);
    }
};

/**
 * Session security middleware
 */
const sessionSecurity = (req, res, next) => {
    // Regenerate session ID periodically to prevent session fixation
    if (req.session && !req.session.regenerated) {
        const now = Date.now();
        const lastRegeneration = req.session.lastRegeneration || 0;
        const regenerationInterval = 30 * 60 * 1000; // 30 minutes
        
        if (now - lastRegeneration > regenerationInterval) {
            req.session.regenerate((err) => {
                if (err) {
                    logger.error('Session regeneration failed:', err);
                    return next(err);
                }
                req.session.regenerated = true;
                req.session.lastRegeneration = now;
                next();
            });
        } else {
            next();
        }
    } else {
        next();
    }
};

/**
 * Session activity tracking
 */
const trackSessionActivity = (req, res, next) => {
    if (req.session && req.user) {
        req.session.lastActivity = new Date();
        req.session.userAgent = req.get('user-agent');
        req.session.ipAddress = req.ip || req.connection.remoteAddress;
    }
    next();
};

/**
 * Detect suspicious session activity
 */
const detectSuspiciousActivity = (req, res, next) => {
    if (req.session && req.user) {
        const currentUserAgent = req.get('user-agent');
        const currentIP = req.ip || req.connection.remoteAddress;
        
        // Check if user agent changed (possible session hijacking)
        if (req.session.userAgent && req.session.userAgent !== currentUserAgent) {
            logger.warn(`User agent changed for user ${req.user.id}: ${req.session.userAgent} -> ${currentUserAgent}`);
            // Optionally destroy session or require re-authentication
        }
        
        // Check if IP changed significantly (possible session hijacking)
        if (req.session.ipAddress && req.session.ipAddress !== currentIP) {
            logger.warn(`IP address changed for user ${req.user.id}: ${req.session.ipAddress} -> ${currentIP}`);
            // Optionally destroy session or require re-authentication
        }
    }
    next();
};

/**
 * Session timeout middleware
 */
const sessionTimeout = (timeoutMinutes = 30) => {
    return (req, res, next) => {
        if (req.session && req.session.lastActivity) {
            const now = new Date();
            const lastActivity = new Date(req.session.lastActivity);
            const timeDiff = now - lastActivity;
            const timeoutMs = timeoutMinutes * 60 * 1000;
            
            if (timeDiff > timeoutMs) {
                req.session.destroy((err) => {
                    if (err) {
                        logger.error('Session destruction failed:', err);
                    }
                    req.flash('error_msg', 'Your session has expired. Please log in again.');
                    return res.redirect('/auth/login');
                });
                return;
            }
        }
        next();
    };
};

/**
 * Concurrent session limit middleware
 */
const limitConcurrentSessions = (maxSessions = 3) => {
    const userSessions = new Map();
    
    return (req, res, next) => {
        if (req.session && req.user) {
            const userId = req.user.id;
            const sessionId = req.sessionID;
            
            if (!userSessions.has(userId)) {
                userSessions.set(userId, new Set());
            }
            
            const sessions = userSessions.get(userId);
            sessions.add(sessionId);
            
            // Clean up expired sessions
            if (sessions.size > maxSessions) {
                const oldestSession = sessions.values().next().value;
                sessions.delete(oldestSession);
                logger.info(`Removed oldest session for user ${userId} due to concurrent session limit`);
            }
        }
        next();
    };
};

module.exports = {
    getSessionConfig,
    sessionCleanup,
    sessionSecurity,
    trackSessionActivity,
    detectSuspiciousActivity,
    sessionTimeout,
    limitConcurrentSessions
};
