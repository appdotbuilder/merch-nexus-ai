
import { db } from '../db';
import { collectionsTable, savedProductsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function deleteCollection(userId: string, collectionId: string): Promise<void> {
  try {
    // First verify the collection exists and belongs to the user
    const collections = await db.select()
      .from(collectionsTable)
      .where(and(
        eq(collectionsTable.id, collectionId),
        eq(collectionsTable.user_id, userId)
      ))
      .execute();

    if (collections.length === 0) {
      throw new Error('Collection not found or access denied');
    }

    // Update saved products to set collection_id to null
    await db.update(savedProductsTable)
      .set({ collection_id: null })
      .where(eq(savedProductsTable.collection_id, collectionId))
      .execute();

    // Delete the collection
    await db.delete(collectionsTable)
      .where(and(
        eq(collectionsTable.id, collectionId),
        eq(collectionsTable.user_id, userId)
      ))
      .execute();
  } catch (error) {
    console.error('Collection deletion failed:', error);
    throw error;
  }
}
