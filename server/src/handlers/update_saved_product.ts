
import { db } from '../db';
import { savedProductsTable, collectionsTable } from '../db/schema';
import { type UpdateSavedProductInput, type SavedProduct } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateSavedProduct(userId: string, input: UpdateSavedProductInput): Promise<SavedProduct> {
  try {
    // First verify the saved product exists and belongs to the user
    const existingSavedProduct = await db.select()
      .from(savedProductsTable)
      .where(
        and(
          eq(savedProductsTable.id, input.id),
          eq(savedProductsTable.user_id, userId)
        )
      )
      .execute();

    if (existingSavedProduct.length === 0) {
      throw new Error('Saved product not found or does not belong to user');
    }

    // If collection_id is provided, verify it exists and belongs to the user
    if (input.collection_id) {
      const collection = await db.select()
        .from(collectionsTable)
        .where(
          and(
            eq(collectionsTable.id, input.collection_id),
            eq(collectionsTable.user_id, userId)
          )
        )
        .execute();

      if (collection.length === 0) {
        throw new Error('Collection not found or does not belong to user');
      }
    }

    // Build update values from input
    const updateValues: any = {
      updated_at: new Date()
    };

    if (input.collection_id !== undefined) {
      updateValues.collection_id = input.collection_id;
    }

    if (input.notes !== undefined) {
      updateValues.notes = input.notes;
    }

    if (input.tags !== undefined) {
      updateValues.tags = input.tags; // Store as jsonb directly
    }

    // Update the saved product
    const result = await db.update(savedProductsTable)
      .set(updateValues)
      .where(
        and(
          eq(savedProductsTable.id, input.id),
          eq(savedProductsTable.user_id, userId)
        )
      )
      .returning()
      .execute();

    const updatedSavedProduct = result[0];

    // Return with proper tags handling
    return {
      ...updatedSavedProduct,
      tags: Array.isArray(updatedSavedProduct.tags) 
        ? updatedSavedProduct.tags 
        : (updatedSavedProduct.tags as string[])
    };
  } catch (error) {
    console.error('Update saved product failed:', error);
    throw error;
  }
}
