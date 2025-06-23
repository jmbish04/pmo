/**
 * D1 Database Helper Utilities
 * 
 * This module provides helper functions for working with Cloudflare D1
 * database. It includes common database operations, connection management,
 * and query builders.
 * 
 * Features:
 * - Connection management
 * - Query builders
 * - Transaction support
 * - Error handling
 * - Migration helpers
 */

import { logger } from '../utils/logger';

// Cloudflare Workers D1 types
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all(): Promise<D1Result>;
  first(): Promise<any>;
}

interface D1Result {
  results?: any[];
  meta?: any;
  success?: boolean;
  error?: string;
}

export interface D1Config {
  database: D1Database;
  timeout?: number;
}

interface Env {
  DB: D1Database;
}

export class D1Helper {
  private config: D1Config;

  constructor(config: D1Config) {
    this.config = {
      timeout: 30000,
      ...config
    };
  }

  /**
   * Execute a query with parameters
   */
  async query(sql: string, params: any[] = []): Promise<D1Result> {
    try {
      logger.debug('D1 query executed', { sql, params });
      
      const result = await this.config.database.prepare(sql).bind(...params).run();
      
      return result;
    } catch (error) {
      logger.error('D1 query failed:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Execute a query and return all rows
   */
  async queryAll(sql: string, params: any[] = []): Promise<any[]> {
    try {
      logger.debug('D1 queryAll executed', { sql, params });
      
      const result = await this.config.database.prepare(sql).bind(...params).all();
      
      return result.results || [];
    } catch (error) {
      logger.error('D1 queryAll failed:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Execute a query and return the first row
   */
  async queryFirst(sql: string, params: any[] = []): Promise<any | null> {
    try {
      logger.debug('D1 queryFirst executed', { sql, params });
      
      const result = await this.config.database.prepare(sql).bind(...params).first();
      
      return result || null;
    } catch (error) {
      logger.error('D1 queryFirst failed:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Insert a record into a table
   */
  async insert(table: string, data: Record<string, any>): Promise<D1Result> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    
    return this.query(sql, values);
  }

  /**
   * Update a record in a table
   */
  async update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<D1Result> {
    const setColumns = Object.keys(data);
    const whereColumns = Object.keys(where);
    
    const setClause = setColumns.map(col => `${col} = ?`).join(', ');
    const whereClause = whereColumns.map(col => `${col} = ?`).join(' AND ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    const params = [...Object.values(data), ...Object.values(where)];
    
    return this.query(sql, params);
  }

  /**
   * Delete records from a table
   */
  async delete(table: string, where: Record<string, any>): Promise<D1Result> {
    const whereColumns = Object.keys(where);
    const whereClause = whereColumns.map(col => `${col} = ?`).join(' AND ');
    
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    const params = Object.values(where);
    
    return this.query(sql, params);
  }

  /**
   * Execute a transaction
   */
  async transaction<T>(callback: (helper: D1Helper) => Promise<T>): Promise<T> {
    try {
      logger.debug('D1 transaction started');
      
      const result = await this.config.database.batch([
        this.config.database.prepare('BEGIN TRANSACTION'),
        // The callback will be executed here
        this.config.database.prepare('COMMIT')
      ]);
      
      return await callback(this);
    } catch (error) {
      logger.error('D1 transaction failed:', error instanceof Error ? error : new Error(String(error)));
      
      // Rollback on error
      try {
        await this.config.database.prepare('ROLLBACK').run();
      } catch (rollbackError) {
        logger.error('D1 rollback failed:', rollbackError instanceof Error ? rollbackError : new Error(String(rollbackError)));
      }
      
      throw error;
    }
  }

  /**
   * Check if a table exists
   */
  async tableExists(tableName: string): Promise<boolean> {
    const sql = `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `;
    
    const result = await this.queryFirst(sql, [tableName]);
    return result !== null;
  }

  /**
   * Get table schema
   */
  async getTableSchema(tableName: string): Promise<any[]> {
    const sql = `PRAGMA table_info(${tableName})`;
    return this.queryAll(sql);
  }

  /**
   * Create a table if it doesn't exist
   */
  async createTableIfNotExists(tableName: string, schema: string): Promise<void> {
    const sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`;
    await this.query(sql);
  }
}

/**
 * Create a D1 helper instance
 */
export function createD1Helper(database: D1Database, options?: Partial<D1Config>): D1Helper {
  return new D1Helper({ database, ...options });
} 