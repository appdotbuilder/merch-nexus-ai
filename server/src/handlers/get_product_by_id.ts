
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const product = results[0];
    
    // Convert numeric fields back to numbers
    return {
      ...product,
      price: parseFloat(product.price),
      rating: product.rating ? parseFloat(product.rating) : null,
      keywords: product.keywords as string[] // Cast jsonb to string array
    };
  } catch (error) {
    console.error('Product fetch failed:', error);
    throw error;
  }
};
