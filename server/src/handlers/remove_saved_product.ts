
import { db } from '../db';
import { savedProductsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function removeSavedProduct(userId: string, savedProductId: string): Promise<void> {
  try {
    // Delete the saved product, ensuring it belongs to the user
    await db.delete(savedProductsTable)
      .where(
        and(
          eq(savedProductsTable.id, savedProductId),
          eq(savedProductsTable.user_id, userId)
        )
      )
      .execute();
  } catch (error) {
    console.error('Remove saved product failed:', error);
    throw error;
  }
}
