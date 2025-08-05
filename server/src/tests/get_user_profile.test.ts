
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUserProfile } from '../handlers/get_user_profile';

describe('getUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return user profile when user exists', async () => {
    // Create test user
    const testUser = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
        subscription_tier: 'pro'
      })
      .returning()
      .execute();

    const userId = testUser[0].id;

    const result = await getUserProfile(userId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.email).toEqual('test@example.com');
    expect(result!.full_name).toEqual('Test User');
    expect(result!.avatar_url).toEqual('https://example.com/avatar.jpg');
    expect(result!.subscription_tier).toEqual('pro');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when user does not exist', async () => {
    const nonExistentUserId = '550e8400-e29b-41d4-a716-446655440000';

    const result = await getUserProfile(nonExistentUserId);

    expect(result).toBeNull();
  });

  it('should handle user with null fields correctly', async () => {
    // Create user with minimal required fields
    const testUser = await db.insert(usersTable)
      .values({
        email: 'minimal@example.com',
        full_name: null,
        avatar_url: null,
        subscription_tier: 'free'
      })
      .returning()
      .execute();

    const userId = testUser[0].id;

    const result = await getUserProfile(userId);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(userId);
    expect(result!.email).toEqual('minimal@example.com');
    expect(result!.full_name).toBeNull();
    expect(result!.avatar_url).toBeNull();
    expect(result!.subscription_tier).toEqual('free');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
