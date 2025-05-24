const os = require('os');
const process = require('process');
const logger = require('./logger');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        active: 0,
        byMethod: {},
        byRoute: {},
        byStatus: {},
        averageResponseTime: 0,
        responseTimeHistory: []
      },
      system: {
        memory: {},
        cpu: {},
        uptime: 0,
        loadAverage: []
      },
      database: {
        connections: 0,
        queries: {
          total: 0,
          slow: 0,
          failed: 0,
          averageTime: 0
        }
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      }
    };

    this.startTime = Date.now();
    this.requestTimes = [];
    this.maxHistorySize = 1000;

    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Log performance summary every 5 minutes
    setInterval(() => {
      this.logPerformanceSummary();
    }, 300000);

    // Clean up old metrics every hour
    setInterval(() => {
      this.cleanupMetrics();
    }, 3600000);
  }

  // Request monitoring middleware
  requestMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      this.metrics.requests.active++;
      this.metrics.requests.total++;

      // Track method
      if (!this.metrics.requests.byMethod[req.method]) {
        this.metrics.requests.byMethod[req.method] = 0;
      }
      this.metrics.requests.byMethod[req.method]++;

      // Track route
      const route = req.route ? req.route.path : req.path;
      if (!this.metrics.requests.byRoute[route]) {
        this.metrics.requests.byRoute[route] = 0;
      }
      this.metrics.requests.byRoute[route]++;

      // Override res.end to capture metrics
      const originalEnd = res.end;
      res.end = function(...args) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        // Update metrics
        this.metrics.requests.active--;
        
        // Track status code
        if (!this.metrics.requests.byStatus[res.statusCode]) {
          this.metrics.requests.byStatus[res.statusCode] = 0;
        }
        this.metrics.requests.byStatus[res.statusCode]++;

        // Track response time
        this.requestTimes.push(responseTime);
        if (this.requestTimes.length > this.maxHistorySize) {
          this.requestTimes.shift();
        }

        // Calculate average response time
        this.metrics.requests.averageResponseTime = 
          this.requestTimes.reduce((sum, time) => sum + time, 0) / this.requestTimes.length;

        // Log slow requests
        if (responseTime > 1000) {
          logger.warn(`Slow request detected: ${req.method} ${req.path} - ${responseTime}ms`, {
            method: req.method,
            path: req.path,
            responseTime,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          });
        }

        originalEnd.apply(res, args);
      }.bind(this);

      next();
    };
  }

  // Database query monitoring
  trackDatabaseQuery(queryTime, isSuccessful = true, isSlow = false) {
    this.metrics.database.queries.total++;
    
    if (!isSuccessful) {
      this.metrics.database.queries.failed++;
    }
    
    if (isSlow) {
      this.metrics.database.queries.slow++;
    }

    // Update average query time
    if (isSuccessful) {
      const currentAvg = this.metrics.database.queries.averageTime;
      const totalQueries = this.metrics.database.queries.total - this.metrics.database.queries.failed;
      this.metrics.database.queries.averageTime = 
        ((currentAvg * (totalQueries - 1)) + queryTime) / totalQueries;
    }
  }

  // Error tracking
  trackError(error, type = 'general', context = {}) {
    this.metrics.errors.total++;
    
    if (!this.metrics.errors.byType[type]) {
      this.metrics.errors.byType[type] = 0;
    }
    this.metrics.errors.byType[type]++;

    // Store recent errors (last 100)
    const errorRecord = {
      timestamp: new Date(),
      message: error.message || error,
      type,
      stack: error.stack,
      context
    };

    this.metrics.errors.recent.push(errorRecord);
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent.shift();
    }

    logger.error(`Error tracked: ${type}`, errorRecord);
  }

  // System metrics collection
  collectSystemMetrics() {
    try {
      // Memory metrics
      const memUsage = process.memoryUsage();
      this.metrics.system.memory = {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        systemTotal: os.totalmem(),
        systemFree: os.freemem(),
        systemUsage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
      };

      // CPU metrics
      const cpus = os.cpus();
      this.metrics.system.cpu = {
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        usage: this.getCpuUsage()
      };

      // System uptime
      this.metrics.system.uptime = {
        process: process.uptime(),
        system: os.uptime(),
        application: (Date.now() - this.startTime) / 1000
      };

      // Load average (Unix-like systems only)
      try {
        this.metrics.system.loadAverage = os.loadavg();
      } catch (error) {
        this.metrics.system.loadAverage = [0, 0, 0]; // Windows fallback
      }

    } catch (error) {
      logger.error('Error collecting system metrics:', error);
    }
  }

  // CPU usage calculation
  getCpuUsage() {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (let type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - Math.floor((idle / total) * 100);

    return Math.max(0, Math.min(100, usage));
  }

  // Get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date(),
      uptime: (Date.now() - this.startTime) / 1000
    };
  }

  // Get health status
  getHealthStatus() {
    const metrics = this.getMetrics();
    const issues = [];

    // Check memory usage
    if (metrics.system.memory.systemUsage > 90) {
      issues.push('High system memory usage');
    }

    if (metrics.system.memory.heapUsed / metrics.system.memory.heapTotal > 0.9) {
      issues.push('High heap memory usage');
    }

    // Check response times
    if (metrics.requests.averageResponseTime > 2000) {
      issues.push('High average response time');
    }

    // Check error rate
    const errorRate = metrics.errors.total / Math.max(metrics.requests.total, 1);
    if (errorRate > 0.05) { // 5% error rate
      issues.push('High error rate');
    }

    // Check database performance
    if (metrics.database.queries.averageTime > 1000) {
      issues.push('Slow database queries');
    }

    const isHealthy = issues.length === 0;

    return {
      healthy: isHealthy,
      status: isHealthy ? 'healthy' : 'degraded',
      issues,
      metrics: {
        responseTime: metrics.requests.averageResponseTime,
        errorRate: (errorRate * 100).toFixed(2) + '%',
        memoryUsage: metrics.system.memory.systemUsage + '%',
        uptime: metrics.uptime,
        activeRequests: metrics.requests.active
      }
    };
  }

  // Performance summary logging
  logPerformanceSummary() {
    const metrics = this.getMetrics();
    const health = this.getHealthStatus();

    logger.info('Performance Summary', {
      requests: {
        total: metrics.requests.total,
        active: metrics.requests.active,
        averageResponseTime: Math.round(metrics.requests.averageResponseTime) + 'ms',
        topRoutes: this.getTopRoutes(5)
      },
      system: {
        memory: {
          heapUsed: Math.round(metrics.system.memory.heapUsed / 1024 / 1024) + 'MB',
          systemUsage: metrics.system.memory.systemUsage + '%'
        },
        cpu: metrics.system.cpu.usage + '%',
        uptime: Math.round(metrics.system.uptime.application) + 's'
      },
      database: {
        totalQueries: metrics.database.queries.total,
        averageTime: Math.round(metrics.database.queries.averageTime) + 'ms',
        slowQueries: metrics.database.queries.slow,
        failedQueries: metrics.database.queries.failed
      },
      errors: {
        total: metrics.errors.total,
        recentCount: metrics.errors.recent.length
      },
      health: health.status
    });

    if (!health.healthy) {
      logger.warn('Performance issues detected:', health.issues);
    }
  }

  // Get top routes by request count
  getTopRoutes(limit = 10) {
    return Object.entries(this.metrics.requests.byRoute)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([route, count]) => ({ route, count }));
  }

  // Cleanup old metrics
  cleanupMetrics() {
    // Keep only recent response times
    if (this.requestTimes.length > this.maxHistorySize) {
      this.requestTimes = this.requestTimes.slice(-this.maxHistorySize);
    }

    // Keep only recent errors
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(-100);
    }

    logger.debug('Metrics cleanup completed');
  }

  // Reset metrics
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        active: 0,
        byMethod: {},
        byRoute: {},
        byStatus: {},
        averageResponseTime: 0,
        responseTimeHistory: []
      },
      system: {
        memory: {},
        cpu: {},
        uptime: 0,
        loadAverage: []
      },
      database: {
        connections: 0,
        queries: {
          total: 0,
          slow: 0,
          failed: 0,
          averageTime: 0
        }
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      }
    };

    this.requestTimes = [];
    this.startTime = Date.now();

    logger.info('Performance metrics reset');
  }

  // Export metrics for external monitoring
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      ...this.getMetrics()
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = performanceMonitor;
