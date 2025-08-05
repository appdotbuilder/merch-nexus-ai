
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, collectionsTable, savedProductsTable } from '../db/schema';
import { type UpdateSavedProductInput } from '../schema';
import { updateSavedProduct } from '../handlers/update_saved_product';
import { eq } from 'drizzle-orm';

describe('updateSavedProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: string;
  let testProductId: string;
  let testCollectionId: string;
  let testSavedProductId: string;

  const setupTestData = async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        title: 'Test Product',
        category: 'Electronics',
        price: '29.99',
        keywords: ['test', 'product'] // Store as jsonb array directly
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({
        user_id: testUserId,
        name: 'Test Collection'
      })
      .returning()
      .execute();
    testCollectionId = collectionResult[0].id;

    // Create saved product
    const savedProductResult = await db.insert(savedProductsTable)
      .values({
        user_id: testUserId,
        product_id: testProductId,
        notes: 'Original notes',
        tags: ['original', 'tag'] // Store as jsonb array directly
      })
      .returning()
      .execute();
    testSavedProductId = savedProductResult[0].id;
  };

  it('should update saved product with all fields', async () => {
    await setupTestData();

    const input: UpdateSavedProductInput = {
      id: testSavedProductId,
      collection_id: testCollectionId,
      notes: 'Updated notes',
      tags: ['updated', 'tag', 'new']
    };

    const result = await updateSavedProduct(testUserId, input);

    expect(result.id).toEqual(testSavedProductId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.collection_id).toEqual(testCollectionId);
    expect(result.notes).toEqual('Updated notes');
    expect(result.tags).toEqual(['updated', 'tag', 'new']);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update saved product with partial fields', async () => {
    await setupTestData();

    const input: UpdateSavedProductInput = {
      id: testSavedProductId,
      notes: 'Only notes updated'
    };

    const result = await updateSavedProduct(testUserId, input);

    expect(result.notes).toEqual('Only notes updated');
    expect(result.tags).toEqual(['original', 'tag']); // Should remain unchanged
    expect(result.collection_id).toBeNull(); // Should remain unchanged
  });

  it('should set collection_id to null', async () => {
    await setupTestData();

    // First set a collection
    await updateSavedProduct(testUserId, {
      id: testSavedProductId,
      collection_id: testCollectionId
    });

    // Then set it to null
    const input: UpdateSavedProductInput = {
      id: testSavedProductId,
      collection_id: null
    };

    const result = await updateSavedProduct(testUserId, input);

    expect(result.collection_id).toBeNull();
  });

  it('should persist changes to database', async () => {
    await setupTestData();

    const input: UpdateSavedProductInput = {
      id: testSavedProductId,
      notes: 'Database test notes',
      tags: ['database', 'test']
    };

    await updateSavedProduct(testUserId, input);

    // Verify changes in database
    const savedProducts = await db.select()
      .from(savedProductsTable)
      .where(eq(savedProductsTable.id, testSavedProductId))
      .execute();

    expect(savedProducts).toHaveLength(1);
    expect(savedProducts[0].notes).toEqual('Database test notes');
    expect(savedProducts[0].tags).toEqual(['database', 'test']); // jsonb is returned as array
  });

  it('should throw error when saved product does not exist', async () => {
    await setupTestData();

    // Use a valid UUID format
    const fakeUuid = '550e8400-e29b-41d4-a716-446655440000';
    const input: UpdateSavedProductInput = {
      id: fakeUuid,
      notes: 'Should fail'
    };

    expect(updateSavedProduct(testUserId, input)).rejects.toThrow(/not found/i);
  });

  it('should throw error when saved product belongs to different user', async () => {
    await setupTestData();

    // Create another user
    const anotherUserResult = await db.insert(usersTable)
      .values({
        email: 'another@example.com',
        subscription_tier: 'free'
      })
      .returning()
      .execute();

    const input: UpdateSavedProductInput = {
      id: testSavedProductId,
      notes: 'Should fail'
    };

    expect(updateSavedProduct(anotherUserResult[0].id, input)).rejects.toThrow(/not found/i);
  });

  it('should throw error when collection does not exist', async () => {
    await setupTestData();

    // Use a valid UUID format
    const fakeUuid = '550e8400-e29b-41d4-a716-446655440001';
    const input: UpdateSavedProductInput = {
      id: testSavedProductId,
      collection_id: fakeUuid
    };

    expect(updateSavedProduct(testUserId, input)).rejects.toThrow(/collection not found/i);
  });

  it('should throw error when collection belongs to different user', async () => {
    await setupTestData();

    // Create another user and their collection
    const anotherUserResult = await db.insert(usersTable)
      .values({
        email: 'another@example.com',
        subscription_tier: 'free'
      })
      .returning()
      .execute();

    const anotherCollectionResult = await db.insert(collectionsTable)
      .values({
        user_id: anotherUserResult[0].id,
        name: 'Another Collection'
      })
      .returning()
      .execute();

    const input: UpdateSavedProductInput = {
      id: testSavedProductId,
      collection_id: anotherCollectionResult[0].id
    };

    expect(updateSavedProduct(testUserId, input)).rejects.toThrow(/collection not found/i);
  });
});
