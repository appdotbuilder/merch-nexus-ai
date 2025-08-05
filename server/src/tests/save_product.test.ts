
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, productsTable, collectionsTable, savedProductsTable } from '../db/schema';
import { type SaveProductInput } from '../schema';
import { saveProduct } from '../handlers/save_product';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  email: 'test@example.com',
  full_name: 'Test User',
  avatar_url: null,
  subscription_tier: 'free' as const
};

const testProduct = {
  id: '550e8400-e29b-41d4-a716-446655440002',
  asin: 'B08N5WRWNW',
  title: 'Test Product',
  brand: 'Test Brand',
  category: 'Electronics',
  subcategory: 'Headphones',
  price: '99.99',
  sales_rank: 1000,
  rating: '4.5',
  review_count: 250,
  image_url: 'https://example.com/image.jpg',
  keywords: JSON.stringify(['wireless', 'bluetooth']),
  estimated_monthly_sales: 500,
  competition_level: 'medium' as const
};

const testCollection = {
  id: '550e8400-e29b-41d4-a716-446655440003',
  user_id: testUser.id,
  name: 'My Electronics',
  description: 'Electronics collection',
  color: '#ff0000'
};

const testInput: SaveProductInput = {
  product_id: testProduct.id,
  collection_id: testCollection.id,
  notes: 'Great product for testing',
  tags: ['electronics', 'favorite']
};

describe('saveProduct', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create test user
    await db.insert(usersTable).values(testUser).execute();
    
    // Create test product
    await db.insert(productsTable).values(testProduct).execute();
    
    // Create test collection
    await db.insert(collectionsTable).values(testCollection).execute();
  });
  
  afterEach(resetDB);

  it('should save a product with collection', async () => {
    const result = await saveProduct(testUser.id, testInput);

    expect(result.user_id).toEqual(testUser.id);
    expect(result.product_id).toEqual(testProduct.id);
    expect(result.collection_id).toEqual(testCollection.id);
    expect(result.notes).toEqual('Great product for testing');
    expect(result.tags).toEqual(['electronics', 'favorite']);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save a product without collection', async () => {
    const inputWithoutCollection: SaveProductInput = {
      product_id: testProduct.id,
      notes: 'Product without collection',
      tags: ['uncategorized']
    };

    const result = await saveProduct(testUser.id, inputWithoutCollection);

    expect(result.user_id).toEqual(testUser.id);
    expect(result.product_id).toEqual(testProduct.id);
    expect(result.collection_id).toBeNull();
    expect(result.notes).toEqual('Product without collection');
    expect(result.tags).toEqual(['uncategorized']);
  });

  it('should save to database correctly', async () => {
    const result = await saveProduct(testUser.id, testInput);

    const savedProducts = await db.select()
      .from(savedProductsTable)
      .where(eq(savedProductsTable.id, result.id))
      .execute();

    expect(savedProducts).toHaveLength(1);
    const savedProduct = savedProducts[0];
    expect(savedProduct.user_id).toEqual(testUser.id);
    expect(savedProduct.product_id).toEqual(testProduct.id);
    expect(savedProduct.collection_id).toEqual(testCollection.id);
    expect(savedProduct.notes).toEqual('Great product for testing');
    expect(savedProduct.created_at).toBeInstanceOf(Date);
  });

  it('should handle minimal input', async () => {
    const minimalInput: SaveProductInput = {
      product_id: testProduct.id
    };

    const result = await saveProduct(testUser.id, minimalInput);

    expect(result.user_id).toEqual(testUser.id);
    expect(result.product_id).toEqual(testProduct.id);
    expect(result.collection_id).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.tags).toEqual([]);
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentUserId = '550e8400-e29b-41d4-a716-446655440099';
    
    expect(saveProduct(nonExistentUserId, testInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error for non-existent product', async () => {
    const inputWithInvalidProduct: SaveProductInput = {
      product_id: '550e8400-e29b-41d4-a716-446655440099',
      collection_id: testCollection.id
    };
    
    expect(saveProduct(testUser.id, inputWithInvalidProduct)).rejects.toThrow(/product not found/i);
  });

  it('should throw error for non-existent collection', async () => {
    const inputWithInvalidCollection: SaveProductInput = {
      product_id: testProduct.id,
      collection_id: '550e8400-e29b-41d4-a716-446655440099'
    };
    
    expect(saveProduct(testUser.id, inputWithInvalidCollection)).rejects.toThrow(/collection not found/i);
  });

  it('should throw error for collection not belonging to user', async () => {
    // Create another user
    const otherUser = {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'other@example.com',
      full_name: 'Other User',
      avatar_url: null,
      subscription_tier: 'free' as const
    };
    
    await db.insert(usersTable).values(otherUser).execute();
    
    // Create collection for other user
    const otherCollection = {
      id: '550e8400-e29b-41d4-a716-446655440005',
      user_id: otherUser.id,
      name: 'Other Collection',
      description: 'Collection for other user',
      color: '#00ff00'
    };
    
    await db.insert(collectionsTable).values(otherCollection).execute();
    
    const inputWithOtherUsersCollection: SaveProductInput = {
      product_id: testProduct.id,
      collection_id: otherCollection.id
    };
    
    expect(saveProduct(testUser.id, inputWithOtherUsersCollection)).rejects.toThrow(/collection not found or does not belong to user/i);
  });
});
