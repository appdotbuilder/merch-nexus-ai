
import { db } from '../db';
import { savedProductsTable, productsTable } from '../db/schema';
import { type SavedProduct } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export async function getSavedProducts(userId: string, collectionId?: string): Promise<SavedProduct[]> {
  try {
    // Build base query
    let query = db.select({
      id: savedProductsTable.id,
      user_id: savedProductsTable.user_id,
      product_id: savedProductsTable.product_id,
      collection_id: savedProductsTable.collection_id,
      notes: savedProductsTable.notes,
      tags: savedProductsTable.tags,
      created_at: savedProductsTable.created_at,
      updated_at: savedProductsTable.updated_at
    })
    .from(savedProductsTable)
    .innerJoin(productsTable, eq(savedProductsTable.product_id, productsTable.id));

    // Build conditions array
    const conditions: SQL<unknown>[] = [
      eq(savedProductsTable.user_id, userId)
    ];

    // Add collection filter if provided
    if (collectionId !== undefined) {
      conditions.push(eq(savedProductsTable.collection_id, collectionId));
    }

    // Apply where clause and execute
    const results = await query.where(and(...conditions)).execute();

    // Convert the results to match SavedProduct schema
    return results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      product_id: result.product_id,
      collection_id: result.collection_id,
      notes: result.notes,
      tags: result.tags as string[], // Cast jsonb to string array
      created_at: result.created_at,
      updated_at: result.updated_at
    }));
  } catch (error) {
    console.error('Failed to get saved products:', error);
    throw error;
  }
}
