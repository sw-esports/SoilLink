const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Database indexing optimization script
 * Creates optimal indexes for better query performance
 */

class DatabaseIndexOptimizer {
  constructor() {
    this.indexes = new Map();
  }

  async createIndexes() {
    try {
      logger.info('Starting database index optimization...');

      // User model indexes
      await this.createUserIndexes();
      
      // Session indexes (if using MongoDB session store)
      await this.createSessionIndexes();
      
      // Performance and analytics indexes
      await this.createAnalyticsIndexes();

      logger.info('Database index optimization completed successfully');
      return true;
    } catch (error) {
      logger.error('Database index optimization failed:', error);
      return false;
    }
  }

  async createUserIndexes() {
    const db = mongoose.connection.db;
    const userCollection = db.collection('users');

    try {
      // Email index (unique, for login and registration)
      await userCollection.createIndex(
        { email: 1 }, 
        { 
          unique: true, 
          background: true,
          name: 'email_unique_idx'
        }
      );
      logger.info('Created unique email index for users');

      // Created date index (for user analytics and reporting)
      await userCollection.createIndex(
        { createdAt: -1 }, 
        { 
          background: true,
          name: 'createdAt_desc_idx'
        }
      );
      logger.info('Created createdAt index for users');

      // Updated date index (for recent activity tracking)
      await userCollection.createIndex(
        { updatedAt: -1 }, 
        { 
          background: true,
          name: 'updatedAt_desc_idx'
        }
      );
      logger.info('Created updatedAt index for users');

      // Compound index for email + active status (if you add active field later)
      await userCollection.createIndex(
        { email: 1, isActive: 1 }, 
        { 
          background: true,
          name: 'email_active_compound_idx',
          partialFilterExpression: { isActive: { $exists: true } }
        }
      );
      logger.info('Created email + active status compound index for users');

    } catch (error) {
      logger.error('Error creating user indexes:', error);
      throw error;
    }
  }

  async createSessionIndexes() {
    const db = mongoose.connection.db;
    
    try {
      // Check if sessions collection exists
      const collections = await db.listCollections({ name: 'sessions' }).toArray();
      
      if (collections.length > 0) {
        const sessionCollection = db.collection('sessions');

        // Session ID index (primary lookup)
        await sessionCollection.createIndex(
          { _id: 1 }, 
          { 
            background: true,
            name: 'sessionId_idx'
          }
        );

        // Expiration index (for automatic cleanup)
        await sessionCollection.createIndex(
          { expires: 1 }, 
          { 
            background: true,
            expireAfterSeconds: 0,
            name: 'session_expiry_idx'
          }
        );

        // User ID index (for user session management)
        await sessionCollection.createIndex(
          { 'session.user._id': 1 }, 
          { 
            background: true,
            name: 'session_userId_idx',
            sparse: true
          }
        );

        logger.info('Created session indexes');
      } else {
        logger.info('Sessions collection not found, skipping session indexes');
      }
    } catch (error) {
      logger.error('Error creating session indexes:', error);
      // Don't throw error for sessions - it's optional
    }
  }

  async createAnalyticsIndexes() {
    const db = mongoose.connection.db;

    try {
      // Create analytics collection if it doesn't exist
      const analyticsExists = await db.listCollections({ name: 'analytics' }).toArray();
      
      if (analyticsExists.length === 0) {
        await db.createCollection('analytics');
        logger.info('Created analytics collection');
      }

      const analyticsCollection = db.collection('analytics');

      // Timestamp index for time-series data
      await analyticsCollection.createIndex(
        { timestamp: -1 }, 
        { 
          background: true,
          name: 'timestamp_desc_idx'
        }
      );

      // Event type index
      await analyticsCollection.createIndex(
        { eventType: 1 }, 
        { 
          background: true,
          name: 'eventType_idx'
        }
      );

      // User ID index for user-specific analytics
      await analyticsCollection.createIndex(
        { userId: 1 }, 
        { 
          background: true,
          name: 'userId_idx',
          sparse: true
        }
      );

      // Compound index for user + timestamp (for user activity queries)
      await analyticsCollection.createIndex(
        { userId: 1, timestamp: -1 }, 
        { 
          background: true,
          name: 'userId_timestamp_compound_idx',
          sparse: true
        }
      );

      // TTL index for automatic data cleanup (keep data for 90 days)
      await analyticsCollection.createIndex(
        { timestamp: 1 }, 
        { 
          background: true,
          expireAfterSeconds: 7776000, // 90 days
          name: 'analytics_ttl_idx'
        }
      );

      logger.info('Created analytics indexes');
    } catch (error) {
      logger.error('Error creating analytics indexes:', error);
      throw error;
    }
  }

  async analyzeIndexUsage() {
    try {
      const db = mongoose.connection.db;
      const collections = ['users', 'sessions', 'analytics'];
      
      logger.info('Analyzing index usage...');

      for (const collectionName of collections) {
        try {
          const collection = db.collection(collectionName);
          
          // Get index stats
          const indexStats = await collection.aggregate([
            { $indexStats: {} }
          ]).toArray();

          if (indexStats.length > 0) {
            logger.info(`Index usage for ${collectionName}:`, 
              indexStats.map(stat => ({
                name: stat.name,
                usageCount: stat.accesses?.ops || 0,
                since: stat.accesses?.since || 'Unknown'
              }))
            );
          }
        } catch (error) {
          logger.warn(`Could not analyze indexes for ${collectionName}:`, error.message);
        }
      }
    } catch (error) {
      logger.error('Error analyzing index usage:', error);
    }
  }

  async dropUnusedIndexes() {
    try {
      const db = mongoose.connection.db;
      const collections = ['users', 'sessions', 'analytics'];
      
      logger.info('Checking for unused indexes...');

      for (const collectionName of collections) {
        try {
          const collection = db.collection(collectionName);
          
          // Get index stats
          const indexStats = await collection.aggregate([
            { $indexStats: {} }
          ]).toArray();

          for (const stat of indexStats) {
            const usageCount = stat.accesses?.ops || 0;
            const indexName = stat.name;
            
            // Don't drop _id_ index or recently created indexes
            if (indexName !== '_id_' && usageCount === 0) {
              logger.warn(`Found unused index: ${collectionName}.${indexName}`);
              // Uncomment the line below to actually drop unused indexes
              // await collection.dropIndex(indexName);
              // logger.info(`Dropped unused index: ${collectionName}.${indexName}`);
            }
          }
        } catch (error) {
          logger.warn(`Could not check unused indexes for ${collectionName}:`, error.message);
        }
      }
    } catch (error) {
      logger.error('Error checking unused indexes:', error);
    }
  }

  async getIndexInfo() {
    try {
      const db = mongoose.connection.db;
      const collections = ['users', 'sessions', 'analytics'];
      const indexInfo = {};

      for (const collectionName of collections) {
        try {
          const collection = db.collection(collectionName);
          const indexes = await collection.indexes();
          indexInfo[collectionName] = indexes;
        } catch (error) {
          logger.warn(`Could not get index info for ${collectionName}:`, error.message);
          indexInfo[collectionName] = [];
        }
      }

      return indexInfo;
    } catch (error) {
      logger.error('Error getting index information:', error);
      return {};
    }
  }

  async optimizeQueries() {
    try {
      logger.info('Running query optimization analysis...');

      // Enable profiling for slow queries (queries taking more than 100ms)
      const db = mongoose.connection.db;
      await db.runCommand({ profile: 2, slowms: 100 });
      
      logger.info('Database profiling enabled for queries > 100ms');
      
      // You can add specific query optimization suggestions here
      const suggestions = [
        'Consider adding compound indexes for frequently used query patterns',
        'Use projection to limit returned fields in large documents',
        'Implement pagination for large result sets',
        'Use aggregation pipeline for complex queries instead of multiple queries',
        'Consider read preferences for read-heavy workloads'
      ];

      logger.info('Query optimization suggestions:', suggestions);

      return suggestions;
    } catch (error) {
      logger.error('Error running query optimization:', error);
      return [];
    }
  }

  async healthCheck() {
    try {
      const db = mongoose.connection.db;
      
      // Check database connection
      const adminDb = db.admin();
      const result = await adminDb.ping();
      
      if (result.ok !== 1) {
        throw new Error('Database ping failed');
      }

      // Get database stats
      const stats = await db.stats();
      
      return {
        healthy: true,
        connection: 'active',
        stats: {
          collections: stats.collections,
          dataSize: Math.round(stats.dataSize / 1024 / 1024) + 'MB',
          indexSize: Math.round(stats.indexSize / 1024 / 1024) + 'MB',
          avgObjSize: Math.round(stats.avgObjSize) + ' bytes'
        }
      };
    } catch (error) {
      logger.error('Database health check failed:', error);
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

module.exports = DatabaseIndexOptimizer;
