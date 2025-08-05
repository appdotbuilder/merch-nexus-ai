
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { type UpdateCollectionInput } from '../schema';
import { updateCollection } from '../handlers/update_collection';
import { eq } from 'drizzle-orm';

// Test user data
const testUser = {
  email: 'test@example.com',
  full_name: 'Test User',
  subscription_tier: 'free' as const
};

// Test collection data
const testCollection = {
  name: 'Original Collection',
  description: 'Original description',
  color: '#ff0000'
};

describe('updateCollection', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update collection name', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test collection
    const collections = await db.insert(collectionsTable)
      .values({
        ...testCollection,
        user_id: userId
      })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    const input: UpdateCollectionInput = {
      id: collectionId,
      name: 'Updated Collection Name'
    };

    const result = await updateCollection(userId, input);

    expect(result.id).toEqual(collectionId);
    expect(result.name).toEqual('Updated Collection Name');
    expect(result.description).toEqual('Original description');
    expect(result.color).toEqual('#ff0000');
    expect(result.user_id).toEqual(userId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update collection description and color', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test collection
    const collections = await db.insert(collectionsTable)
      .values({
        ...testCollection,
        user_id: userId
      })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    const input: UpdateCollectionInput = {
      id: collectionId,
      description: 'Updated description',
      color: '#00ff00'
    };

    const result = await updateCollection(userId, input);

    expect(result.id).toEqual(collectionId);
    expect(result.name).toEqual('Original Collection');
    expect(result.description).toEqual('Updated description');
    expect(result.color).toEqual('#00ff00');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update collection in database', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test collection
    const collections = await db.insert(collectionsTable)
      .values({
        ...testCollection,
        user_id: userId
      })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    const input: UpdateCollectionInput = {
      id: collectionId,
      name: 'Database Updated Name',
      description: null,
      color: '#0000ff'
    };

    await updateCollection(userId, input);

    // Verify in database
    const updatedCollections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, collectionId))
      .execute();

    expect(updatedCollections).toHaveLength(1);
    const updatedCollection = updatedCollections[0];
    expect(updatedCollection.name).toEqual('Database Updated Name');
    expect(updatedCollection.description).toBeNull();
    expect(updatedCollection.color).toEqual('#0000ff');
    expect(updatedCollection.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when collection not found', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    const input: UpdateCollectionInput = {
      id: '550e8400-e29b-41d4-a716-446655440000', // Non-existent ID
      name: 'Updated Name'
    };

    await expect(updateCollection(userId, input))
      .rejects.toThrow(/collection not found or access denied/i);
  });

  it('should throw error when user does not own collection', async () => {
    // Create test users
    const users1 = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const user1Id = users1[0].id;

    const users2 = await db.insert(usersTable)
      .values({
        ...testUser,
        email: 'other@example.com'
      })
      .returning()
      .execute();
    const user2Id = users2[0].id;

    // Create collection owned by user1
    const collections = await db.insert(collectionsTable)
      .values({
        ...testCollection,
        user_id: user1Id
      })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    const input: UpdateCollectionInput = {
      id: collectionId,
      name: 'Unauthorized Update'
    };

    // Try to update with user2
    await expect(updateCollection(user2Id, input))
      .rejects.toThrow(/collection not found or access denied/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values(testUser)
      .returning()
      .execute();
    const userId = users[0].id;

    // Create test collection
    const collections = await db.insert(collectionsTable)
      .values({
        ...testCollection,
        user_id: userId
      })
      .returning()
      .execute();
    const collectionId = collections[0].id;

    // Update only color
    const input: UpdateCollectionInput = {
      id: collectionId,
      color: '#purple'
    };

    const result = await updateCollection(userId, input);

    expect(result.name).toEqual('Original Collection'); // Unchanged
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.color).toEqual('#purple'); // Changed
  });
});
