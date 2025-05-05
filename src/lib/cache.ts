/**
 * LRU cache implementation for efficient in-memory caching
 */
import { LRUCache } from 'lru-cache';

// Define options for the cache
const options = {
  // Maximum number of items to store
  max: 500,

  // Default TTL in milliseconds (5 minutes)
  ttl: 5 * 60 * 1000,

  // How to handle stale items (immediately delete)
  updateAgeOnGet: true,

  // Allow providing custom TTL per item
  allowStale: false,
};

// Define a more specific type for cache values
type CacheValue = string | number | boolean | object;

// Create and export the cache instance directly
const cache = new LRUCache<string, CacheValue>(options);

export default cache;
