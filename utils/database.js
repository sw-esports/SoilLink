// Database optimization utilities
const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Optimized MongoDB connection configuration
 */
const getDatabaseConfig = () => {
    const isProduction = process.env.NODE_ENV === 'production';
      return {
        maxPoolSize: isProduction ? 10 : 5, // Connection pool size
        serverSelectionTimeoutMS: 5000, // How long to try selecting server
        socketTimeoutMS: 45000, // How long to wait for socket
        
        // Connection monitoring
        monitorCommands: !isProduction, // Monitor in development only
        
        // Read/Write concerns for consistency
        readPreference: 'primary',
        w: 'majority',
        j: true, // Journal writes
        
        // Retry logic
        retryWrites: true,
        retryReads: true,
        
        // Timeouts
        connectTimeoutMS: 10000,
        heartbeatFrequencyMS: 30000
    };
};

/**
 * Database connection with optimizations
 */
const connectDatabase = async () => {
    try {
        const config = getDatabaseConfig();
        await mongoose.connect(process.env.MONGODB_URI, config);
        
        logger.info('MongoDB connected successfully');
        
        // Set up connection event handlers
        mongoose.connection.on('error', (err) => {
            logger.error('MongoDB connection error:', err);
        });
        
        mongoose.connection.on('disconnected', () => {
            logger.warn('MongoDB disconnected');
        });
        
        mongoose.connection.on('reconnected', () => {
            logger.info('MongoDB reconnected');
        });
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed through app termination');
            process.exit(0);
        });
        
    } catch (error) {
        logger.error('Database connection failed:', error);
        process.exit(1);
    }
};

/**
 * Database health check
 */
const checkDatabaseHealth = async () => {
    try {
        const state = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        
        const isHealthy = state === 1;
        const status = states[state] || 'unknown';
        
        // Get additional stats if connected
        let stats = {};
        if (isHealthy) {
            const db = mongoose.connection.db;
            const dbStats = await db.stats();
            stats = {
                collections: dbStats.collections,
                dataSize: dbStats.dataSize,
                indexSize: dbStats.indexSize,
                storageSize: dbStats.storageSize
            };
        }
        
        return {
            healthy: isHealthy,
            status,
            stats,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        logger.error('Database health check failed:', error);
        return {
            healthy: false,
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Query optimization middleware
 */
const optimizeQuery = (schema) => {
    // Add lean() to find queries for better performance
    schema.pre(['find', 'findOne', 'findOneAndUpdate'], function() {
        if (!this.getOptions().hasOwnProperty('lean')) {
            this.lean();
        }
    });
    
    // Add indexing recommendations
    schema.post('save', function() {
        if (process.env.NODE_ENV === 'development') {
            logger.debug(`Document saved in ${this.constructor.modelName}`);
        }
    });
};

/**
 * Pagination helper
 */
const paginate = (query, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
};

/**
 * Database performance monitoring
 */
const monitorPerformance = () => {
    if (process.env.NODE_ENV === 'development') {
        mongoose.set('debug', (collectionName, method, query, doc) => {
            logger.debug(`Mongoose: ${collectionName}.${method}`, {
                query,
                doc: doc ? doc.toString() : undefined
            });
        });
    }
};

/**
 * Index creation helper
 */
const ensureIndexes = async (models) => {
    try {
        for (const [modelName, model] of Object.entries(models)) {
            await model.ensureIndexes();
            logger.info(`Indexes ensured for ${modelName}`);
        }
    } catch (error) {
        logger.error('Index creation failed:', error);
    }
};

/**
 * Database cleanup utilities
 */
const cleanupOldData = async () => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        // Example: Clean up old sessions
        const sessionsCleanup = await mongoose.connection.db
            .collection('sessions')
            .deleteMany({ expires: { $lt: thirtyDaysAgo } });
            
        logger.info(`Cleaned up ${sessionsCleanup.deletedCount} expired sessions`);
        
        // Add more cleanup operations as needed
        
    } catch (error) {
        logger.error('Database cleanup failed:', error);
    }
};

/**
 * Schedule periodic database maintenance
 */
const scheduleMaintenanceTasks = () => {
    // Run cleanup every 24 hours
    setInterval(cleanupOldData, 24 * 60 * 60 * 1000);
    
    // Log database health every hour
    setInterval(async () => {
        const health = await checkDatabaseHealth();
        if (!health.healthy) {
            logger.warn('Database health check failed:', health);
        }
    }, 60 * 60 * 1000);
};

module.exports = {
    getDatabaseConfig,
    connectDatabase,
    checkDatabaseHealth,
    optimizeQuery,
    paginate,
    monitorPerformance,
    ensureIndexes,
    cleanupOldData,
    scheduleMaintenanceTasks
};
