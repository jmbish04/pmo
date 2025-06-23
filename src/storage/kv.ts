/**
 * KV Storage Layer
 * 
 * This module provides a wrapper around Cloudflare KV for storing
 * agent cache, tokens, and other key-value data. It includes
 * serialization, caching, and error handling.
 * 
 * Features:
 * - JSON serialization/deserialization
 * - TTL support for cache expiration
 * - Batch operations
 * - Error handling and retries
 * - Type-safe operations
 */

import { logger } from '../utils/logger';

export interface KVConfig {
  namespace: KVNamespace;
  defaultTTL?: number;
  retries?: number;
}

export class KVHelper {
  private config: KVConfig;

  constructor(config: KVConfig) {
    this.config = {
      defaultTTL: 3600, // 1 hour
      retries: 3,
      ...config
    };
  }

  /**
   * Get a value from KV
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      logger.debug('KV get operation', { key });
      
      const value = await this.config.namespace.get(key);
      
      if (value === null) {
        return null;
      }
      
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('KV get failed:', error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }

  /**
   * Get a value with metadata
   */
  async getWithMetadata<T>(key: string): Promise<{ value: T | null; metadata: KVNamespaceGetWithMetadataResult<unknown, unknown>['metadata'] }> {
    try {
      logger.debug('KV getWithMetadata operation', { key });
      
      const result = await this.config.namespace.getWithMetadata(key);
      
      if (result.value === null) {
        return { value: null, metadata: result.metadata };
      }
      
      const parsedValue = JSON.parse(result.value) as T;
      return { value: parsedValue, metadata: result.metadata };
    } catch (error) {
      logger.error('KV getWithMetadata failed:', error instanceof Error ? error : new Error(String(error)));
      return { value: null, metadata: null };
    }
  }

  /**
   * Put a value in KV
   */
  async put<T>(key: string, value: T, options?: KVNamespacePutOptions): Promise<void> {
    try {
      logger.debug('KV put operation', { key, ttl: options?.expirationTtl });
      
      const serializedValue = JSON.stringify(value);
      await this.config.namespace.put(key, serializedValue, options);
    } catch (error) {
      logger.error('KV put failed:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Put a value with TTL
   */
  async putWithTTL<T>(key: string, value: T, ttl: number): Promise<void> {
    return this.put(key, value, { expirationTtl: ttl });
  }

  /**
   * Delete a value from KV
   */
  async delete(key: string): Promise<void> {
    try {
      logger.debug('KV delete operation', { key });
      
      await this.config.namespace.delete(key);
    } catch (error) {
      logger.error('KV delete failed:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * List keys with optional prefix
   */
  async list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown>> {
    try {
      logger.debug('KV list operation', { prefix: options?.prefix });
      
      return await this.config.namespace.list(options);
    } catch (error) {
      logger.error('KV list failed:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get multiple values at once
   */
  async getMultiple<T>(keys: string[]): Promise<Record<string, T | null>> {
    try {
      logger.debug('KV getMultiple operation', { keyCount: keys.length });
      
      const promises = keys.map(async (key) => {
        const value = await this.get<T>(key);
        return { key, value };
      });
      
      const results = await Promise.all(promises);
      
      const resultMap: Record<string, T | null> = {};
      results.forEach(({ key, value }) => {
        resultMap[key] = value;
      });
      
      return resultMap;
    } catch (error) {
      logger.error('KV getMultiple failed:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Put multiple values at once
   */
  async putMultiple<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    try {
      logger.debug('KV putMultiple operation', { entryCount: entries.length });
      
      const promises = entries.map(({ key, value, ttl }) => {
        const options = ttl ? { expirationTtl: ttl } : undefined;
        return this.put(key, value, options);
      });
      
      await Promise.all(promises);
    } catch (error) {
      logger.error('KV putMultiple failed:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Store agent cache data
   */
  async storeAgentCache(agentId: string, data: any, ttl?: number): Promise<void> {
    const key = `agent_cache:${agentId}`;
    const cacheTTL = ttl || this.config.defaultTTL;
    
    await this.putWithTTL(key, {
      data,
      timestamp: new Date().toISOString(),
      agentId
    }, typeof cacheTTL === 'number' ? cacheTTL : 0);
  }

  /**
   * Get agent cache data
   */
  async getAgentCache<T>(agentId: string): Promise<T | null> {
    const key = `agent_cache:${agentId}`;
    const result = await this.get<{ data: T; timestamp: string; agentId: string }>(key);
    
    return result ? result.data : null;
  }

  /**
   * Store access token
   */
  async storeToken(tokenId: string, tokenData: any, ttl?: number): Promise<void> {
    const key = `token:${tokenId}`;
    const tokenTTL = ttl || this.config.defaultTTL;
    
    await this.putWithTTL(key, {
      ...tokenData,
      storedAt: new Date().toISOString()
    }, typeof tokenTTL === 'number' ? tokenTTL : 0);
  }

  /**
   * Get access token
   */
  async getToken<T>(tokenId: string): Promise<T | null> {
    const key = `token:${tokenId}`;
    return this.get<T>(key);
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    try {
      logger.debug('KV clearExpiredCache operation');
      
      const listResult = await this.list({ prefix: 'agent_cache:' });
      let clearedCount = 0;
      
      for (const key of listResult.keys) {
        const result = await this.getWithMetadata(key.name);
        
        if (result.metadata && typeof result.metadata === 'object' && 'expiration' in result.metadata && result.metadata.expiration) {
          const expirationTime = new Date((result.metadata.expiration as number) * 1000);
          
          if (expirationTime < new Date()) {
            await this.delete(key.name);
            clearedCount++;
          }
        }
      }
      
      logger.info(`Cleared ${clearedCount} expired cache entries`);
      return clearedCount;
    } catch (error) {
      logger.error('KV clearExpiredCache failed:', error instanceof Error ? error : new Error(String(error)));
      return 0;
    }
  }
}

/**
 * Create a KV helper instance
 */
export function createKVHelper(namespace: KVNamespace, options?: Partial<KVConfig>): KVHelper {
  return new KVHelper({ namespace, ...options });
} 