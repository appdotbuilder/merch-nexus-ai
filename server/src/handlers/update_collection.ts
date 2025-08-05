
import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type UpdateCollectionInput, type Collection } from '../schema';
import { eq, and } from 'drizzle-orm';

export async function updateCollection(userId: string, input: UpdateCollectionInput): Promise<Collection> {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    if (input.color !== undefined) {
      updateData.color = input.color;
    }

    // Update collection with ownership verification
    const result = await db.update(collectionsTable)
      .set(updateData)
      .where(and(
        eq(collectionsTable.id, input.id),
        eq(collectionsTable.user_id, userId)
      ))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error('Collection not found or access denied');
    }

    return result[0];
  } catch (error) {
    console.error('Collection update failed:', error);
    throw error;
  }
}
