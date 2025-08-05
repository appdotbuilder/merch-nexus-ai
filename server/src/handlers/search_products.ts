
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type SearchProductsInput, type Product } from '../schema';
import { and, eq, gte, lte, ilike, desc, count } from 'drizzle-orm';

export async function searchProducts(input: SearchProductsInput): Promise<{ products: Product[]; total: number }> {
  try {
    // Calculate offset for pagination
    const offset = (input.page - 1) * input.limit;

    // Build conditions array
    const conditions = [];

    // Apply filters
    if (input.query) {
      conditions.push(ilike(productsTable.title, `%${input.query}%`));
    }

    if (input.category) {
      conditions.push(eq(productsTable.category, input.category));
    }

    if (input.min_price !== undefined) {
      conditions.push(gte(productsTable.price, input.min_price.toString()));
    }

    if (input.max_price !== undefined) {
      conditions.push(lte(productsTable.price, input.max_price.toString()));
    }

    if (input.min_rating !== undefined) {
      conditions.push(gte(productsTable.rating, input.min_rating.toString()));
    }

    if (input.competition_level) {
      conditions.push(eq(productsTable.competition_level, input.competition_level));
    }

    // Build the main query
    const whereClause = conditions.length > 0 
      ? (conditions.length === 1 ? conditions[0] : and(...conditions))
      : undefined;

    // Execute main query
    const results = whereClause
      ? await db.select()
          .from(productsTable)
          .where(whereClause)
          .orderBy(desc(productsTable.created_at))
          .limit(input.limit)
          .offset(offset)
          .execute()
      : await db.select()
          .from(productsTable)
          .orderBy(desc(productsTable.created_at))
          .limit(input.limit)
          .offset(offset)
          .execute();

    // Get total count with same conditions
    const totalResult = whereClause
      ? await db.select({ count: count() })
          .from(productsTable)
          .where(whereClause)
          .execute()
      : await db.select({ count: count() })
          .from(productsTable)
          .execute();

    const total = totalResult[0]?.count || 0;

    // Convert numeric fields and return
    const products: Product[] = results.map(product => ({
      ...product,
      price: parseFloat(product.price),
      rating: product.rating ? parseFloat(product.rating) : null,
      keywords: product.keywords as string[]
    }));

    return {
      products,
      total
    };
  } catch (error) {
    console.error('Product search failed:', error);
    throw error;
  }
}
