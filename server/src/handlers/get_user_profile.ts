
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const user = results[0];
    return {
      ...user,
      created_at: new Date(user.created_at),
      updated_at: new Date(user.updated_at)
    };
  } catch (error) {
    console.error('Get user profile failed:', error);
    throw error;
  }
}
