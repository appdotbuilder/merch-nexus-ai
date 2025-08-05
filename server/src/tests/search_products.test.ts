
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type SearchProductsInput } from '../schema';
import { searchProducts } from '../handlers/search_products';

// Test product data
const testProducts = [
  {
    asin: 'B001TEST01',
    title: 'iPhone Case Premium',
    brand: 'Apple',
    category: 'Electronics',
    subcategory: 'Phone Accessories',
    price: '29.99',
    sales_rank: 100,
    rating: '4.5',
    review_count: 1500,
    image_url: 'https://example.com/iphone-case.jpg',
    keywords: JSON.stringify(['phone', 'case', 'premium']),
    estimated_monthly_sales: 5000,
    competition_level: 'medium' as const
  },
  {
    asin: 'B002TEST02',
    title: 'Wireless Headphones',
    brand: 'Sony',
    category: 'Electronics',
    subcategory: 'Audio',
    price: '199.99',
    sales_rank: 50,
    rating: '4.8',
    review_count: 2300,
    image_url: 'https://example.com/headphones.jpg',
    keywords: JSON.stringify(['wireless', 'headphones', 'bluetooth']),
    estimated_monthly_sales: 3000,
    competition_level: 'high' as const
  },
  {
    asin: 'B003TEST03',
    title: 'Gaming Mouse',
    brand: 'Logitech',
    category: 'Computers',
    subcategory: 'Accessories',
    price: '79.99',
    sales_rank: 200,
    rating: '4.2',
    review_count: 800,
    image_url: 'https://example.com/mouse.jpg',
    keywords: JSON.stringify(['gaming', 'mouse', 'rgb']),
    estimated_monthly_sales: 1500,
    competition_level: 'low' as const
  }
];

describe('searchProducts', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test products
    await db.insert(productsTable).values(testProducts).execute();
  });

  afterEach(resetDB);

  it('should return all products with default pagination', async () => {
    const input: SearchProductsInput = {
      page: 1,
      limit: 20
    };
    const result = await searchProducts(input);

    expect(result.products).toHaveLength(3);
    expect(result.total).toBe(3);
    
    // Verify numeric conversions
    result.products.forEach(product => {
      expect(typeof product.price).toBe('number');
      expect(typeof product.rating).toBe('number');
      expect(Array.isArray(product.keywords)).toBe(true);
    });
  });

  it('should filter by search query', async () => {
    const input: SearchProductsInput = {
      query: 'iPhone',
      page: 1,
      limit: 20
    };
    const result = await searchProducts(input);

    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.products[0].title).toBe('iPhone Case Premium');
  });

  it('should filter by category', async () => {
    const input: SearchProductsInput = {
      category: 'Electronics',
      page: 1,
      limit: 20
    };
    const result = await searchProducts(input);

    expect(result.products).toHaveLength(2);
    expect(result.total).toBe(2);
    result.products.forEach(product => {
      expect(product.category).toBe('Electronics');
    });
  });

  it('should filter by price range', async () => {
    const input: SearchProductsInput = {
      min_price: 50,
      max_price: 100,
      page: 1,
      limit: 20
    };
    const result = await searchProducts(input);

    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.products[0].title).toBe('Gaming Mouse');
    expect(result.products[0].price).toBe(79.99);
  });

  it('should filter by minimum rating', async () => {
    const input: SearchProductsInput = {
      min_rating: 4.5,
      page: 1,
      limit: 20
    };
    const result = await searchProducts(input);

    expect(result.products).toHaveLength(2);
    expect(result.total).toBe(2);
    result.products.forEach(product => {
      expect(product.rating).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('should filter by competition level', async () => {
    const input: SearchProductsInput = {
      competition_level: 'low',
      page: 1,
      limit: 20
    };
    const result = await searchProducts(input);

    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.products[0].competition_level).toBe('low');
  });

  it('should handle pagination correctly', async () => {
    const input: SearchProductsInput = {
      page: 2,
      limit: 2
    };
    const result = await searchProducts(input);

    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(3);
  });

  it('should combine multiple filters', async () => {
    const input: SearchProductsInput = {
      category: 'Electronics',
      min_price: 100,
      min_rating: 4.5,
      page: 1,
      limit: 20
    };
    const result = await searchProducts(input);

    expect(result.products).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.products[0].title).toBe('Wireless Headphones');
    expect(result.products[0].category).toBe('Electronics');
    expect(result.products[0].price).toBeGreaterThanOrEqual(100);
    expect(result.products[0].rating).toBeGreaterThanOrEqual(4.5);
  });

  it('should return empty results when no matches', async () => {
    const input: SearchProductsInput = {
      query: 'NonexistentProduct',
      page: 1,
      limit: 20
    };
    const result = await searchProducts(input);

    expect(result.products).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should order products by created_at descending', async () => {
    const input: SearchProductsInput = {
      page: 1,
      limit: 20
    };
    const result = await searchProducts(input);

    expect(result.products).toHaveLength(3);
    
    // Verify ordering (most recent first)
    for (let i = 0; i < result.products.length - 1; i++) {
      expect(result.products[i].created_at.getTime())
        .toBeGreaterThanOrEqual(result.products[i + 1].created_at.getTime());
    }
  });
});
