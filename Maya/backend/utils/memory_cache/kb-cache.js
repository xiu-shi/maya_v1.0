/**
 * KB Cache Manager
 * 
 * Provides intelligent caching, memory management, and cache validation
 * for the Knowledge Base system to ensure reliability and trust.
 * 
 * Features:
 * - In-memory caching with size limits
 * - Cache validation (checksum/hash)
 * - Automatic cache invalidation
 * - Memory leak prevention
 * - Cache statistics and monitoring
 */

import { createHash } from 'crypto';
import { logInfo, logError } from '../logger.js';
import { loadKBContext } from '../kb-loader.js';

/**
 * Cache Configuration
 */
const CACHE_CONFIG = {
  // Maximum cache size in bytes (default: 1MB)
  MAX_CACHE_SIZE: parseInt(process.env.KB_MAX_CACHE_SIZE || '1048576', 10),
  
  // Cache TTL (Time To Live) in seconds (default: 1 hour)
  CACHE_TTL: parseInt(process.env.KB_CACHE_TTL || '3600', 10),
  
  // Enable cache validation (checksum)
  VALIDATE_CACHE: process.env.KB_VALIDATE_CACHE !== 'false',
  
  // Enable memory monitoring
  MONITOR_MEMORY: process.env.KB_MONITOR_MEMORY !== 'false'
};

/**
 * Cache Entry Structure
 */
class CacheEntry {
  constructor(context, metadata = {}) {
    this.context = context;
    this.timestamp = new Date();
    this.size = Buffer.byteLength(context, 'utf8');
    this.checksum = this.calculateChecksum(context);
    this.accessCount = 0;
    this.lastAccessed = new Date();
    this.metadata = {
      documentCount: metadata.documentCount || 0,
      source: metadata.source || 'local',
      ...metadata
    };
  }

  calculateChecksum(content) {
    return createHash('sha256').update(content).digest('hex');
  }

  isValid() {
    // Check TTL
    const age = (Date.now() - this.timestamp.getTime()) / 1000;
    if (age > CACHE_CONFIG.CACHE_TTL) {
      return false;
    }

    // Validate checksum if enabled
    if (CACHE_CONFIG.VALIDATE_CACHE) {
      const currentChecksum = this.calculateChecksum(this.context);
      if (currentChecksum !== this.checksum) {
        return false;
      }
    }

    return true;
  }

  touch() {
    this.accessCount++;
    this.lastAccessed = new Date();
  }

  getMemoryUsage() {
    return {
      contextSize: this.size,
      overhead: 200, // Approximate overhead for object properties
      total: this.size + 200
    };
  }
}

/**
 * KB Cache Manager
 */
class KBCacheManager {
  constructor() {
    this.cache = null; // CacheEntry or null
    this.loading = false;
    this.loadPromise = null;
    this.stats = {
      hits: 0,
      misses: 0,
      invalidations: 0,
      refreshes: 0,
      errors: 0,
      totalMemoryUsed: 0
    };
  }

  /**
   * Get cached KB context or load if not cached/invalid
   */
  async get(forceRefresh = false) {
    // Force refresh requested
    if (forceRefresh) {
      return await this.refresh();
    }

    // Check if cache exists and is valid
    if (this.cache && this.cache.isValid()) {
      this.cache.touch();
      this.stats.hits++;
      logInfo('KB cache hit', {
        age: Math.round((Date.now() - this.cache.timestamp.getTime()) / 1000) + 's',
        accessCount: this.cache.accessCount
      });
      return this.cache.context;
    }

    // Cache miss or invalid
    if (this.cache && !this.cache.isValid()) {
      logInfo('KB cache invalid, refreshing', {
        reason: this.cache.timestamp ? 'TTL expired' : 'Checksum mismatch'
      });
      this.stats.invalidations++;
      this.cache = null;
    }

    this.stats.misses++;

    // Load KB context
    return await this.load();
  }

  /**
   * Load KB context from disk
   */
  async load() {
    // If already loading, wait for existing promise
    if (this.loading && this.loadPromise) {
      return await this.loadPromise;
    }

    this.loading = true;
    this.loadPromise = loadKBContext()
      .then(context => {
        if (!context) {
          throw new Error('Empty KB context loaded');
        }

        // Check memory limits
        const size = Buffer.byteLength(context, 'utf8');
        if (size > CACHE_CONFIG.MAX_CACHE_SIZE) {
          logError('KB context exceeds cache size limit', new Error('Cache size limit exceeded'), {
            size,
            limit: CACHE_CONFIG.MAX_CACHE_SIZE,
            action: 'Cache will be truncated or rejected'
          });
          // Truncate if too large (shouldn't happen in practice)
          context = context.substring(0, CACHE_CONFIG.MAX_CACHE_SIZE);
        }

        // Create cache entry
        const documentCount = this.estimateDocumentCount(context);
        this.cache = new CacheEntry(context, {
          documentCount,
          source: 'local',
          loadTime: new Date()
        });

        // Update statistics
        this.stats.totalMemoryUsed = this.cache.getMemoryUsage().total;
        this.loading = false;
        this.loadPromise = null;

        logInfo('KB context cached', {
          size,
          documentCount,
          checksum: this.cache.checksum.substring(0, 8) + '...',
          memoryUsage: this.stats.totalMemoryUsed
        });

        return context;
      })
      .catch(error => {
        this.loading = false;
        this.loadPromise = null;
        this.stats.errors++;
        logError('Failed to load KB context', error);
        throw error;
      });

    return await this.loadPromise;
  }

  /**
   * Refresh KB context (force reload)
   */
  async refresh() {
    logInfo('Refreshing KB cache...');
    
    // Clear existing cache
    this.cache = null;
    this.loading = false;
    this.loadPromise = null;
    
    // Load fresh context
    const context = await this.load();
    this.stats.refreshes++;
    
    return context;
  }

  /**
   * Invalidate cache
   */
  invalidate() {
    if (this.cache) {
      logInfo('KB cache invalidated');
      this.cache = null;
      this.stats.invalidations++;
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cacheInfo = this.cache ? {
      timestamp: this.cache.timestamp, // Include timestamp for test compatibility
      age: Math.round((Date.now() - this.cache.timestamp.getTime()) / 1000),
      size: this.cache.size,
      checksum: this.cache.checksum.substring(0, 16) + '...',
      accessCount: this.cache.accessCount,
      lastAccessed: this.cache.lastAccessed.toISOString(),
      isValid: this.cache.isValid(),
      memoryUsage: this.cache.getMemoryUsage()
    } : null;

    return {
      config: {
        maxSize: CACHE_CONFIG.MAX_CACHE_SIZE,
        ttl: CACHE_CONFIG.CACHE_TTL,
        validateCache: CACHE_CONFIG.VALIDATE_CACHE,
        monitorMemory: CACHE_CONFIG.MONITOR_MEMORY
      },
      cache: cacheInfo,
      statistics: {
        ...this.stats,
        hitRate: this.stats.hits + this.stats.misses > 0 
          ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2) + '%'
          : '0%'
      }
    };
  }

  /**
   * Get memory usage information
   */
  getMemoryUsage() {
    if (!this.cache) {
      return {
        cached: false,
        totalMemory: 0,
        cacheSize: 0,
        overhead: 0
      };
    }

    const usage = this.cache.getMemoryUsage();
    return {
      cached: true,
      totalMemory: usage.total,
      cacheSize: usage.contextSize,
      overhead: usage.overhead,
      percentageOfLimit: ((usage.total / CACHE_CONFIG.MAX_CACHE_SIZE) * 100).toFixed(2) + '%'
    };
  }

  /**
   * Validate cache integrity
   */
  validateCache() {
    if (!this.cache) {
      return { valid: false, reason: 'No cache' };
    }

    const isValid = this.cache.isValid();
    const checksumValid = CACHE_CONFIG.VALIDATE_CACHE 
      ? this.cache.checksum === this.cache.calculateChecksum(this.cache.context)
      : true;

    return {
      valid: isValid && checksumValid,
      ttlValid: isValid,
      checksumValid,
      age: Math.round((Date.now() - this.cache.timestamp.getTime()) / 1000),
      reason: !isValid ? 'TTL expired' : !checksumValid ? 'Checksum mismatch' : 'Valid'
    };
  }

  /**
   * Estimate document count from context
   */
  estimateDocumentCount(context) {
    // Count document sections (each document has a "Summary:" line)
    const summaryMatches = context.match(/Summary:/g);
    return summaryMatches ? summaryMatches.length : 0;
  }

  /**
   * Cleanup (for testing or graceful shutdown)
   */
  cleanup() {
    this.cache = null;
    this.loading = false;
    this.loadPromise = null;
    logInfo('KB cache cleaned up');
  }
}

// Singleton instance
const kbCacheManager = new KBCacheManager();

/**
 * Export cache manager functions
 */
export async function getKBCache(forceRefresh = false) {
  return await kbCacheManager.get(forceRefresh);
}

export async function refreshKBCache() {
  return await kbCacheManager.refresh();
}

export function invalidateKBCache() {
  kbCacheManager.invalidate();
}

export function getKBCacheStats() {
  return kbCacheManager.getStats();
}

export function getKBCacheMemoryUsage() {
  return kbCacheManager.getMemoryUsage();
}

export function validateKBCache() {
  return kbCacheManager.validateCache();
}

export default kbCacheManager;
