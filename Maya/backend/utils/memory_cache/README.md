# Memory Cache Module

**Last Updated**: January 9, 2026

## Overview

This module contains all cache and memory management implementations for the Knowledge Base system.

## Files

### `kb-cache.js`
**Purpose**: Intelligent cache manager with memory management

**Features**:
- In-memory caching with size limits
- TTL (Time To Live) based expiration
- SHA-256 checksum validation
- Memory usage monitoring
- Cache statistics tracking
- Automatic cache invalidation

**Exports**:
- `getKBCache(forceRefresh)` - Get cached KB context
- `refreshKBCache()` - Force refresh KB cache
- `invalidateKBCache()` - Invalidate cache
- `getKBCacheStats()` - Get cache statistics
- `validateKBCache()` - Validate cache integrity
- `getKBCacheMemoryUsage()` - Get memory usage info
- `default` - Cache manager instance

### `kb-monitor.js`
**Purpose**: KB monitoring and statistics tracking

**Features**:
- KB load tracking
- KB refresh tracking
- KB update detection
- KB statistics
- Recommendations generation

**Exports**:
- `trackKBLoad(context, documentCount)` - Track KB load
- `trackKBRefresh(context, documentCount)` - Track KB refresh
- `getKBStats()` - Get KB statistics
- `checkKBUpdates()` - Check for KB file updates
- `getKBStatusReport()` - Get detailed status report
- `resetKBStats()` - Reset statistics

## Usage

```javascript
import { getKBCache, refreshKBCache, getKBCacheStats } from './utils/memory_cache/kb-cache.js';
import { getKBStats, checkKBUpdates } from './utils/memory_cache/kb-monitor.js';

// Get cached KB context
const context = await getKBCache();

// Refresh cache
const refreshedContext = await refreshKBCache();

// Get cache statistics
const stats = getKBCacheStats();

// Check for KB updates
const updates = checkKBUpdates();
```

## Configuration

See `../../tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md` for detailed configuration options.

## Related Documentation

- `Maya/tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md` - Comprehensive KB management guide (includes caching, monitoring, and testing)
