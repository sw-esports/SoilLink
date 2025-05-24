const NodeCache = require('node-cache');
const logger = require('./logger');

class CacheManager {
  constructor() {
    // Main cache with 1 hour TTL
    this.cache = new NodeCache({ 
      stdTTL: 3600, // 1 hour
      checkperiod: 600, // Check for expired keys every 10 minutes
      useClones: false,
      deleteOnExpire: true,
      enableLegacyCallbacks: false,
      maxKeys: 1000
    });

    // Session cache with 30 minute TTL
    this.sessionCache = new NodeCache({ 
      stdTTL: 1800, // 30 minutes
      checkperiod: 300, // Check every 5 minutes
      useClones: false,
      deleteOnExpire: true,
      maxKeys: 5000
    });

    // User data cache with 2 hour TTL
    this.userCache = new NodeCache({ 
      stdTTL: 7200, // 2 hours
      checkperiod: 600,
      useClones: false,
      deleteOnExpire: true,
      maxKeys: 10000
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Log cache statistics
    this.cache.on('expired', (key, value) => {
      logger.debug(`Cache key expired: ${key}`);
    });

    this.cache.on('set', (key, value) => {
      logger.debug(`Cache key set: ${key}`);
    });

    this.cache.on('del', (key, value) => {
      logger.debug(`Cache key deleted: ${key}`);
    });

    // Setup periodic stats logging
    setInterval(() => {
      this.logStats();
    }, 300000); // Every 5 minutes
  }

  // General cache methods
  get(key) {
    try {
      const value = this.cache.get(key);
      if (value !== undefined) {
        logger.debug(`Cache hit for key: ${key}`);
        return value;
      }
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  set(key, value, ttl = null) {
    try {
      const result = ttl ? this.cache.set(key, value, ttl) : this.cache.set(key, value);
      if (result) {
        logger.debug(`Cache set successful for key: ${key}`);
      }
      return result;
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  del(key) {
    try {
      const result = this.cache.del(key);
      logger.debug(`Cache delete for key ${key}: ${result > 0 ? 'success' : 'not found'}`);
      return result;
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
      return 0;
    }
  }

  // User-specific cache methods
  getUserData(userId) {
    return this.userCache.get(`user:${userId}`);
  }

  setUserData(userId, userData, ttl = null) {
    const key = `user:${userId}`;
    return ttl ? this.userCache.set(key, userData, ttl) : this.userCache.set(key, userData);
  }

  clearUserData(userId) {
    return this.userCache.del(`user:${userId}`);
  }

  // Session cache methods
  getSession(sessionId) {
    return this.sessionCache.get(`session:${sessionId}`);
  }

  setSession(sessionId, sessionData, ttl = null) {
    const key = `session:${sessionId}`;
    return ttl ? this.sessionCache.set(key, sessionData, ttl) : this.sessionCache.set(key, sessionData);
  }

  clearSession(sessionId) {
    return this.sessionCache.del(`session:${sessionId}`);
  }

  // Dashboard data caching
  getDashboardData(userId) {
    return this.get(`dashboard:${userId}`);
  }

  setDashboardData(userId, dashboardData, ttl = 1800) { // 30 minutes
    return this.set(`dashboard:${userId}`, dashboardData, ttl);
  }

  clearDashboardData(userId) {
    return this.del(`dashboard:${userId}`);
  }

  // API response caching
  getApiResponse(endpoint, params = {}) {
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return this.get(key);
  }

  setApiResponse(endpoint, params = {}, responseData, ttl = 600) { // 10 minutes
    const key = `api:${endpoint}:${JSON.stringify(params)}`;
    return this.set(key, responseData, ttl);
  }

  // Cache management methods
  flush() {
    try {
      this.cache.flushAll();
      this.sessionCache.flushAll();
      this.userCache.flushAll();
      logger.info('All caches flushed successfully');
      return true;
    } catch (error) {
      logger.error('Error flushing caches:', error);
      return false;
    }
  }

  getStats() {
    return {
      main: this.cache.getStats(),
      session: this.sessionCache.getStats(),
      user: this.userCache.getStats()
    };
  }

  logStats() {
    const stats = this.getStats();
    logger.info('Cache statistics:', {
      mainCache: {
        keys: stats.main.keys,
        hits: stats.main.hits,
        misses: stats.main.misses,
        hitRate: stats.main.hits / (stats.main.hits + stats.main.misses) || 0
      },
      sessionCache: {
        keys: stats.session.keys,
        hits: stats.session.hits,
        misses: stats.session.misses,
        hitRate: stats.session.hits / (stats.session.hits + stats.session.misses) || 0
      },
      userCache: {
        keys: stats.user.keys,
        hits: stats.user.hits,
        misses: stats.user.misses,
        hitRate: stats.user.hits / (stats.user.hits + stats.user.misses) || 0
      }
    });
  }

  // Middleware for API response caching
  middleware(ttl = 600) {
    return (req, res, next) => {
      // Only cache GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const key = `route:${req.path}:${JSON.stringify(req.query)}`;
      const cachedResponse = this.get(key);

      if (cachedResponse) {
        logger.debug(`Serving cached response for: ${req.path}`);
        return res.json(cachedResponse);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = (data) => {
        // Cache successful responses only
        if (res.statusCode === 200) {
          this.set(key, data, ttl);
          logger.debug(`Cached response for: ${req.path}`);
        }
        return originalJson.call(res, data);
      };

      next();
    };
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern) {
    try {
      const keys = this.cache.keys();
      const matchingKeys = keys.filter(key => key.includes(pattern));
      
      if (matchingKeys.length > 0) {
        this.cache.del(matchingKeys);
        logger.info(`Invalidated ${matchingKeys.length} cache keys matching pattern: ${pattern}`);
      }
      
      return matchingKeys.length;
    } catch (error) {
      logger.error(`Error invalidating cache pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Health check
  healthCheck() {
    try {
      const testKey = 'health_check_' + Date.now();
      const testValue = 'ok';
      
      // Test set operation
      const setResult = this.cache.set(testKey, testValue, 1);
      if (!setResult) {
        return { healthy: false, error: 'Failed to set test key' };
      }

      // Test get operation
      const getValue = this.cache.get(testKey);
      if (getValue !== testValue) {
        return { healthy: false, error: 'Failed to get test key' };
      }

      // Test delete operation
      const delResult = this.cache.del(testKey);
      if (delResult === 0) {
        return { healthy: false, error: 'Failed to delete test key' };
      }

      return { healthy: true, stats: this.getStats() };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

module.exports = cacheManager;
