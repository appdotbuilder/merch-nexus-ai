
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, savedProductsTable } from '../db/schema';
import { removeSavedProduct } from '../handlers/remove_saved_product';
import { eq, and } from 'drizzle-orm';

describe('removeSavedProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove saved product successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        title: 'Test Product',
        category: 'Electronics',
        price: '99.99',
        keywords: ['test']
      })
      .returning()
      .execute();
    const productId = productResult[0].id;

    // Create saved product
    const savedProductResult = await db.insert(savedProductsTable)
      .values({
        user_id: userId,
        product_id: productId,
        tags: ['favorite']
      })
      .returning()
      .execute();
    const savedProductId = savedProductResult[0].id;

    // Remove the saved product
    await removeSavedProduct(userId, savedProductId);

    // Verify it was removed
    const savedProducts = await db.select()
      .from(savedProductsTable)
      .where(eq(savedProductsTable.id, savedProductId))
      .execute();

    expect(savedProducts).toHaveLength(0);
  });

  it('should only remove saved product belonging to the user', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const user1Id = user1Result[0].id;

    const user2Result = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const user2Id = user2Result[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        title: 'Test Product',
        category: 'Electronics',
        price: '99.99',
        keywords: ['test']
      })
      .returning()
      .execute();
    const productId = productResult[0].id;

    // Create saved product for user2
    const savedProductResult = await db.insert(savedProductsTable)
      .values({
        user_id: user2Id,
        product_id: productId,
        tags: ['favorite']
      })
      .returning()
      .execute();
    const savedProductId = savedProductResult[0].id;

    // Try to remove user2's saved product as user1
    await removeSavedProduct(user1Id, savedProductId);

    // Verify the saved product still exists (wasn't removed)
    const savedProducts = await db.select()
      .from(savedProductsTable)
      .where(eq(savedProductsTable.id, savedProductId))
      .execute();

    expect(savedProducts).toHaveLength(1);
    expect(savedProducts[0].user_id).toEqual(user2Id);
  });

  it('should handle non-existent saved product gracefully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

    // Should not throw an error when trying to remove non-existent saved product
    await expect(removeSavedProduct(userId, nonExistentId)).resolves.toBeUndefined();
  });

  it('should remove correct saved product when user has multiple', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test products
    const product1Result = await db.insert(productsTable)
      .values({
        asin: 'TEST123',
        title: 'Test Product 1',
        category: 'Electronics',
        price: '99.99',
        keywords: ['test']
      })
      .returning()
      .execute();
    const product1Id = product1Result[0].id;

    const product2Result = await db.insert(productsTable)
      .values({
        asin: 'TEST456',
        title: 'Test Product 2',
        category: 'Books',
        price: '19.99',
        keywords: ['book']
      })
      .returning()
      .execute();
    const product2Id = product2Result[0].id;

    // Create two saved products
    const savedProduct1Result = await db.insert(savedProductsTable)
      .values({
        user_id: userId,
        product_id: product1Id,
        tags: ['electronics']
      })
      .returning()
      .execute();
    const savedProduct1Id = savedProduct1Result[0].id;

    const savedProduct2Result = await db.insert(savedProductsTable)
      .values({
        user_id: userId,
        product_id: product2Id,
        tags: ['reading']
      })
      .returning()
      .execute();
    const savedProduct2Id = savedProduct2Result[0].id;

    // Remove only the first saved product
    await removeSavedProduct(userId, savedProduct1Id);

    // Verify only the first was removed
    const remainingSavedProducts = await db.select()
      .from(savedProductsTable)
      .where(eq(savedProductsTable.user_id, userId))
      .execute();

    expect(remainingSavedProducts).toHaveLength(1);
    expect(remainingSavedProducts[0].id).toEqual(savedProduct2Id);
    expect(remainingSavedProducts[0].product_id).toEqual(product2Id);
  });
});
