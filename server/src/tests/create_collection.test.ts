
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { type CreateCollectionInput } from '../schema';
import { createCollection } from '../handlers/create_collection';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

describe('createCollection', () => {
  let testUserId: string;

  beforeEach(async () => {
    await createDB();
    
    // Create a test user first
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;
  });

  afterEach(resetDB);

  it('should create a collection with all fields', async () => {
    const input: CreateCollectionInput = {
      name: 'My Electronics',
      description: 'Collection for electronic products',
      color: '#3B82F6'
    };

    const result = await createCollection(testUserId, input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('My Electronics');
    expect(result.description).toEqual('Collection for electronic products');
    expect(result.color).toEqual('#3B82F6');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a collection with minimal fields', async () => {
    const input: CreateCollectionInput = {
      name: 'Simple Collection'
    };

    const result = await createCollection(testUserId, input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Simple Collection');
    expect(result.description).toBeNull();
    expect(result.color).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save collection to database', async () => {
    const input: CreateCollectionInput = {
      name: 'Test Collection',
      description: 'A test collection',
      color: '#10B981'
    };

    const result = await createCollection(testUserId, input);

    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, result.id))
      .execute();

    expect(collections).toHaveLength(1);
    expect(collections[0].name).toEqual('Test Collection');
    expect(collections[0].description).toEqual('A test collection');
    expect(collections[0].color).toEqual('#10B981');
    expect(collections[0].user_id).toEqual(testUserId);
    expect(collections[0].created_at).toBeInstanceOf(Date);
    expect(collections[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields as null when undefined', async () => {
    const input: CreateCollectionInput = {
      name: 'Basic Collection',
      description: undefined,
      color: undefined
    };

    const result = await createCollection(testUserId, input);

    expect(result.description).toBeNull();
    expect(result.color).toBeNull();

    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, result.id))
      .execute();

    expect(collections[0].description).toBeNull();
    expect(collections[0].color).toBeNull();
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentUserId = randomUUID();
    const input: CreateCollectionInput = {
      name: 'Test Collection'
    };

    await expect(createCollection(nonExistentUserId, input))
      .rejects.toThrow(/violates foreign key constraint/i);
  });

  it('should allow multiple collections for same user', async () => {
    const input1: CreateCollectionInput = {
      name: 'Collection 1',
      description: 'First collection'
    };

    const input2: CreateCollectionInput = {
      name: 'Collection 2',
      description: 'Second collection'
    };

    const result1 = await createCollection(testUserId, input1);
    const result2 = await createCollection(testUserId, input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.user_id).toEqual(testUserId);
    expect(result2.user_id).toEqual(testUserId);
    expect(result1.name).toEqual('Collection 1');
    expect(result2.name).toEqual('Collection 2');

    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, testUserId))
      .execute();

    expect(collections).toHaveLength(2);
  });
});
