
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, collectionsTable, savedProductsTable } from '../db/schema';
import { getSavedProducts } from '../handlers/get_saved_products';

// Test data
const testUser = {
  email: 'test@example.com',
  full_name: 'Test User',
  subscription_tier: 'free' as const
};

const testProduct = {
  asin: 'B123456789',
  title: 'Test Product',
  category: 'Electronics',
  price: '99.99',
  keywords: ['test', 'product']
};

const testCollection = {
  name: 'Test Collection',
  description: 'A test collection'
};

describe('getSavedProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return saved products for a user', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [product] = await db.insert(productsTable).values(testProduct).returning().execute();
    const [collection] = await db.insert(collectionsTable).values({
      ...testCollection,
      user_id: user.id
    }).returning().execute();

    // Create saved product
    const savedProductData = {
      user_id: user.id,
      product_id: product.id,
      collection_id: collection.id,
      notes: 'Test notes',
      tags: ['tag1', 'tag2']
    };

    const [savedProduct] = await db.insert(savedProductsTable)
      .values(savedProductData)
      .returning()
      .execute();

    // Test the handler
    const result = await getSavedProducts(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(savedProduct.id);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].product_id).toEqual(product.id);
    expect(result[0].collection_id).toEqual(collection.id);
    expect(result[0].notes).toEqual('Test notes');
    expect(result[0].tags).toEqual(['tag1', 'tag2']);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter saved products by collection', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [product1] = await db.insert(productsTable).values({
      ...testProduct,
      asin: 'B111111111'
    }).returning().execute();
    const [product2] = await db.insert(productsTable).values({
      ...testProduct,
      asin: 'B222222222'
    }).returning().execute();

    const [collection1] = await db.insert(collectionsTable).values({
      ...testCollection,
      name: 'Collection 1',
      user_id: user.id
    }).returning().execute();
    const [collection2] = await db.insert(collectionsTable).values({
      ...testCollection,
      name: 'Collection 2',
      user_id: user.id
    }).returning().execute();

    // Create saved products in different collections
    await db.insert(savedProductsTable).values({
      user_id: user.id,
      product_id: product1.id,
      collection_id: collection1.id,
      notes: 'Product in collection 1',
      tags: ['tag1']
    }).execute();

    await db.insert(savedProductsTable).values({
      user_id: user.id,
      product_id: product2.id,
      collection_id: collection2.id,
      notes: 'Product in collection 2',
      tags: ['tag2']
    }).execute();

    // Test filtering by collection
    const collection1Results = await getSavedProducts(user.id, collection1.id);
    const collection2Results = await getSavedProducts(user.id, collection2.id);

    expect(collection1Results).toHaveLength(1);
    expect(collection1Results[0].collection_id).toEqual(collection1.id);
    expect(collection1Results[0].notes).toEqual('Product in collection 1');

    expect(collection2Results).toHaveLength(1);
    expect(collection2Results[0].collection_id).toEqual(collection2.id);
    expect(collection2Results[0].notes).toEqual('Product in collection 2');
  });

  it('should return empty array for user with no saved products', async () => {
    // Create user but no saved products
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();

    const result = await getSavedProducts(user.id);

    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should return empty array when filtering by non-existent collection', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [product] = await db.insert(productsTable).values(testProduct).returning().execute();

    // Create saved product without collection
    await db.insert(savedProductsTable).values({
      user_id: user.id,
      product_id: product.id,
      collection_id: null,
      notes: 'No collection',
      tags: []
    }).execute();

    // Filter by non-existent collection ID (use valid UUID format)
    const nonExistentCollectionId = '550e8400-e29b-41d4-a716-446655440000';
    const result = await getSavedProducts(user.id, nonExistentCollectionId);

    expect(result).toHaveLength(0);
  });

  it('should handle saved products without collections', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser).returning().execute();
    const [product] = await db.insert(productsTable).values(testProduct).returning().execute();

    // Create saved product without collection
    const [savedProduct] = await db.insert(savedProductsTable).values({
      user_id: user.id,
      product_id: product.id,
      collection_id: null,
      notes: 'No collection',
      tags: []
    }).returning().execute();

    const result = await getSavedProducts(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].collection_id).toBeNull();
    expect(result[0].notes).toEqual('No collection');
    expect(result[0].tags).toEqual([]);
  });
});
