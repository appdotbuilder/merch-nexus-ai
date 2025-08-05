
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable } from '../db/schema';
import { getUserCollections } from '../handlers/get_user_collections';

describe('getUserCollections', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return collections for a user', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        subscription_tier: 'free'
      })
      .returning()
      .execute();

    // Create test collections
    const [collection1, collection2] = await db.insert(collectionsTable)
      .values([
        {
          user_id: user.id,
          name: 'My Favorites',
          description: 'My favorite products',
          color: 'blue'
        },
        {
          user_id: user.id,
          name: 'Wishlist',
          description: 'Products I want to track',
          color: 'red'
        }
      ])
      .returning()
      .execute();

    const result = await getUserCollections(user.id);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBeDefined();
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].name).toEqual('My Favorites');
    expect(result[0].description).toEqual('My favorite products');
    expect(result[0].color).toEqual('blue');
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Wishlist');
    expect(result[1].description).toEqual('Products I want to track');
    expect(result[1].color).toEqual('red');
  });

  it('should return empty array for user with no collections', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        subscription_tier: 'free'
      })
      .returning()
      .execute();

    const result = await getUserCollections(user.id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should not return collections belonging to other users', async () => {
    // Create two test users
    const [user1, user2] = await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          subscription_tier: 'free'
        },
        {
          email: 'user2@example.com',
          subscription_tier: 'pro'
        }
      ])
      .returning()
      .execute();

    // Create collections for both users
    await db.insert(collectionsTable)
      .values([
        {
          user_id: user1.id,
          name: 'User 1 Collection',
          description: 'Belongs to user 1'
        },
        {
          user_id: user2.id,
          name: 'User 2 Collection',
          description: 'Belongs to user 2'
        }
      ])
      .execute();

    const user1Collections = await getUserCollections(user1.id);
    const user2Collections = await getUserCollections(user2.id);

    expect(user1Collections).toHaveLength(1);
    expect(user1Collections[0].name).toEqual('User 1 Collection');
    expect(user1Collections[0].user_id).toEqual(user1.id);

    expect(user2Collections).toHaveLength(1);
    expect(user2Collections[0].name).toEqual('User 2 Collection');
    expect(user2Collections[0].user_id).toEqual(user2.id);
  });
});
