
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserProfileInput } from '../schema';
import { updateUserProfile } from '../handlers/update_user_profile';
import { eq } from 'drizzle-orm';

describe('updateUserProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        full_name: 'Original Name',
        avatar_url: 'https://example.com/original.jpg',
        subscription_tier: 'free'
      })
      .returning()
      .execute();
    
    testUserId = user[0].id;
  });

  it('should update full_name only', async () => {
    const input: UpdateUserProfileInput = {
      full_name: 'Updated Name'
    };

    const result = await updateUserProfile(testUserId, input);

    expect(result.full_name).toEqual('Updated Name');
    expect(result.avatar_url).toEqual('https://example.com/original.jpg'); // Should remain unchanged
    expect(result.email).toEqual('test@example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update avatar_url only', async () => {
    const input: UpdateUserProfileInput = {
      avatar_url: 'https://example.com/new-avatar.jpg'
    };

    const result = await updateUserProfile(testUserId, input);

    expect(result.avatar_url).toEqual('https://example.com/new-avatar.jpg');
    expect(result.full_name).toEqual('Original Name'); // Should remain unchanged
    expect(result.email).toEqual('test@example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update both full_name and avatar_url', async () => {
    const input: UpdateUserProfileInput = {
      full_name: 'New Full Name',
      avatar_url: 'https://example.com/updated.jpg'
    };

    const result = await updateUserProfile(testUserId, input);

    expect(result.full_name).toEqual('New Full Name');
    expect(result.avatar_url).toEqual('https://example.com/updated.jpg');
    expect(result.email).toEqual('test@example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set fields to null when explicitly provided', async () => {
    const input: UpdateUserProfileInput = {
      full_name: null,
      avatar_url: null
    };

    const result = await updateUserProfile(testUserId, input);

    expect(result.full_name).toBeNull();
    expect(result.avatar_url).toBeNull();
    expect(result.email).toEqual('test@example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateUserProfileInput = {
      full_name: 'Database Test Name',
      avatar_url: 'https://example.com/db-test.jpg'
    };

    await updateUserProfile(testUserId, input);

    // Verify changes were persisted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].full_name).toEqual('Database Test Name');
    expect(users[0].avatar_url).toEqual('https://example.com/db-test.jpg');
    expect(users[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update updated_at timestamp', async () => {
    // Get original timestamp
    const originalUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, testUserId))
      .execute();
    
    const originalTimestamp = originalUser[0].updated_at;

    // Wait a moment to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateUserProfileInput = {
      full_name: 'Timestamp Test'
    };

    const result = await updateUserProfile(testUserId, input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalTimestamp.getTime());
  });

  it('should throw error for non-existent user', async () => {
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
    const input: UpdateUserProfileInput = {
      full_name: 'Test'
    };

    await expect(updateUserProfile(nonExistentId, input))
      .rejects.toThrow(/User with id .+ not found/i);
  });

  it('should handle empty input gracefully', async () => {
    const input: UpdateUserProfileInput = {};

    const result = await updateUserProfile(testUserId, input);

    // Should only update the timestamp
    expect(result.full_name).toEqual('Original Name');
    expect(result.avatar_url).toEqual('https://example.com/original.jpg');
    expect(result.email).toEqual('test@example.com');
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});
