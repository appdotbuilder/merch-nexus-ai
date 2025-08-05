
import { db } from '../db';
import { collectionsTable } from '../db/schema';
import { type Collection } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserCollections(userId: string): Promise<Collection[]> {
  try {
    const results = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, userId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get user collections:', error);
    throw error;
  }
}
