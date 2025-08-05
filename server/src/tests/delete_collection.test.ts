
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, productsTable, savedProductsTable } from '../db/schema';
import { deleteCollection } from '../handlers/delete_collection';
import { eq } from 'drizzle-orm';

describe('deleteCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a collection', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test collection
    const collections = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    // Delete the collection
    await deleteCollection(userId, collectionId);

    // Verify collection is deleted
    const deletedCollections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .execute();

    expect(deletedCollections).toHaveLength(0);
  });

  it('should update saved products to remove collection reference', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test product
    const products = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        title: 'Test Product',
        category: 'Electronics',
        price: '29.99',
        keywords: ['test']
      })
      .returning()
      .execute();
    const productId = products[0].id;

    // Create test collection
    const collections = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    // Create saved product with collection reference
    const savedProducts = await db.insert(savedProductsTable)
      .values({
        user_id: userId,
        product_id: productId,
        collection_id: collectionId,
        notes: 'Test notes',
        tags: ['tag1', 'tag2']
      })
      .returning()
      .execute();
    const savedProductId = savedProducts[0].id;

    // Delete the collection
    await deleteCollection(userId, collectionId);

    // Verify saved product's collection_id is set to null
    const updatedSavedProducts = await db.select()
      .from(savedProductsTable)
      .where(eq(savedProductsTable.id, savedProductId))
      .execute();

    expect(updatedSavedProducts).toHaveLength(1);
    expect(updatedSavedProducts[0].collection_id).toBeNull();
    expect(updatedSavedProducts[0].notes).toEqual('Test notes');
    expect(updatedSavedProducts[0].tags).toEqual(['tag1', 'tag2']);
  });

  it('should throw error when collection does not exist', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    await expect(deleteCollection(userId, nonExistentId))
      .rejects.toThrow(/collection not found or access denied/i);
  });

  it('should throw error when user does not own the collection', async () => {
    // Create first user (owner)
    const ownerUsers = await db.insert(usersTable)
      .values({
        email: 'owner@example.com',
        full_name: 'Owner User',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const ownerId = ownerUsers[0].id;

    // Create second user (non-owner)
    const otherUsers = await db.insert(usersTable)
      .values({
        email: 'other@example.com',
        full_name: 'Other User',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const otherUserId = otherUsers[0].id;

    // Create collection owned by first user
    const collections = await db.insert(collectionsTable)
      .values({
        user_id: ownerId,
        name: 'Owner Collection',
        description: 'Collection owned by first user'
      })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    // Try to delete with second user - should fail
    await expect(deleteCollection(otherUserId, collectionId))
      .rejects.toThrow(/collection not found or access denied/i);

    // Verify collection still exists
    const existingCollections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .execute();

    expect(existingCollections).toHaveLength(1);
  });

  it('should handle multiple saved products in the same collection', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test products
    const products1 = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        title: 'Test Product 1',
        category: 'Electronics',
        price: '29.99',
        keywords: ['test1']
      })
      .returning()
      .execute();
    const product1Id = products1[0].id;

    const products2 = await db.insert(productsTable)
      .values({
        asin: 'TEST456',
        title: 'Test Product 2',
        category: 'Books',
        price: '19.99',
        keywords: ['test2']
      })
      .returning()
      .execute();
    const product2Id = products2[0].id;

    // Create test collection
    const collections = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: 'Test Collection',
        description: 'A test collection'
      })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    // Create multiple saved products with collection reference
    await db.insert(savedProductsTable)
      .values([
        {
          user_id: userId,
          product_id: product1Id,
          collection_id: collectionId,
          notes: 'Product 1 notes',
          tags: ['tag1']
        },
        {
          user_id: userId,
          product_id: product2Id,
          collection_id: collectionId,
          notes: 'Product 2 notes',
          tags: ['tag2']
        }
      ])
      .execute();

    // Delete the collection
    await deleteCollection(userId, collectionId);

    // Verify all saved products' collection_id is set to null
    const updatedSavedProducts = await db.select()
      .from(savedProductsTable)
      .where(eq(savedProductsTable.user_id, userId))
      .execute();

    expect(updatedSavedProducts).toHaveLength(2);
    updatedSavedProducts.forEach(savedProduct => {
      expect(savedProduct.collection_id).toBeNull();
    });
  });
});
