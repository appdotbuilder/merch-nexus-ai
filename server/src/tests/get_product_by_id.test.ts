
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { getProductById } from '../handlers/get_product_by_id';

// Test product data
const testProduct = {
  asin: 'B123456789',
  title: 'Test Product',
  brand: 'Test Brand',
  category: 'Electronics',
  subcategory: 'Smartphones',
  price: '199.99',
  sales_rank: 1000,
  rating: '4.5',
  review_count: 250,
  image_url: 'https://example.com/image.jpg',
  keywords: ['phone', 'smartphone', 'mobile'],
  estimated_monthly_sales: 500,
  competition_level: 'medium' as const
};

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return product when found', async () => {
    // Insert test product
    const insertResult = await db.insert(productsTable)
      .values(testProduct)
      .returning()
      .execute();

    const insertedProduct = insertResult[0];
    
    // Get product by ID
    const result = await getProductById(insertedProduct.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedProduct.id);
    expect(result!.asin).toEqual('B123456789');
    expect(result!.title).toEqual('Test Product');
    expect(result!.brand).toEqual('Test Brand');
    expect(result!.category).toEqual('Electronics');
    expect(result!.subcategory).toEqual('Smartphones');
    expect(result!.price).toEqual(199.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.sales_rank).toEqual(1000);
    expect(result!.rating).toEqual(4.5);
    expect(typeof result!.rating).toEqual('number');
    expect(result!.review_count).toEqual(250);
    expect(result!.image_url).toEqual('https://example.com/image.jpg');
    expect(result!.keywords).toEqual(['phone', 'smartphone', 'mobile']);
    expect(Array.isArray(result!.keywords)).toBe(true);
    expect(result!.estimated_monthly_sales).toEqual(500);
    expect(result!.competition_level).toEqual('medium');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when product not found', async () => {
    const result = await getProductById('00000000-0000-0000-0000-000000000000');
    
    expect(result).toBeNull();
  });

  it('should handle product with null optional fields', async () => {
    // Insert product with minimal required fields
    const minimalProduct = {
      asin: 'B987654321',
      title: 'Minimal Product',
      brand: null,
      category: 'Books',
      subcategory: null,
      price: '9.99',
      sales_rank: null,
      rating: null,
      review_count: null,
      image_url: null,
      keywords: [],
      estimated_monthly_sales: null,
      competition_level: null
    };

    const insertResult = await db.insert(productsTable)
      .values(minimalProduct)
      .returning()
      .execute();

    const insertedProduct = insertResult[0];
    
    // Get product by ID
    const result = await getProductById(insertedProduct.id);

    expect(result).not.toBeNull();
    expect(result!.brand).toBeNull();
    expect(result!.subcategory).toBeNull();
    expect(result!.price).toEqual(9.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.sales_rank).toBeNull();
    expect(result!.rating).toBeNull();
    expect(result!.review_count).toBeNull();
    expect(result!.image_url).toBeNull();
    expect(result!.keywords).toEqual([]);
    expect(result!.estimated_monthly_sales).toBeNull();
    expect(result!.competition_level).toBeNull();
  });
});
