
import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type CreateCollectionInput, type Collection } from '../schema';

export async function createCollection(userId: string, input: CreateCollectionInput): Promise<Collection> {
  try {
    const result = await db.insert(collectionsTable)
      .values({
        user_id: userId,
        name: input.name,
        description: input.description || null,
        color: input.color || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Collection creation failed:', error);
    throw error;
  }
}
