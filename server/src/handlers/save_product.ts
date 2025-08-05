
import { db } from '../db';
import { savedProductsTable, productsTable, usersTable, collectionsTable } from '../db/schema';
import { type SaveProductInput, type SavedProduct } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function saveProduct(userId: string, input: SaveProductInput): Promise<SavedProduct> {
  try {
    // Verify user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();
    
    if (user.length === 0) {
      throw new Error('User not found');
    }

    // Verify product exists
    const product = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();
    
    if (product.length === 0) {
      throw new Error('Product not found');
    }

    // If collection_id is provided, verify it exists and belongs to the user
    if (input.collection_id) {
      const collection = await db.select()
        .from(collectionsTable)
        .where(and(
          eq(collectionsTable.id, input.collection_id),
          eq(collectionsTable.user_id, userId)
        ))
        .execute();
      
      if (collection.length === 0) {
        throw new Error('Collection not found or does not belong to user');
      }
    }

    // Insert saved product record
    const result = await db.insert(savedProductsTable)
      .values({
        user_id: userId,
        product_id: input.product_id,
        collection_id: input.collection_id || null,
        notes: input.notes || null,
        tags: JSON.stringify(input.tags || [])
      })
      .returning()
      .execute();

    const savedProduct = result[0];
    
    // Parse tags back to array
    return {
      ...savedProduct,
      tags: Array.isArray(savedProduct.tags) ? savedProduct.tags : JSON.parse(savedProduct.tags as string)
    };
  } catch (error) {
    console.error('Save product failed:', error);
    throw error;
  }
}
