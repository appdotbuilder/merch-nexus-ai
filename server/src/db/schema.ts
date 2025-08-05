
import { uuid, text, pgTable, timestamp, numeric, integer, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro', 'enterprise']);
export const competitionLevelEnum = pgEnum('competition_level', ['low', 'medium', 'high']);

// Users table
export const usersTable = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  full_name: text('full_name'),
  avatar_url: text('avatar_url'),
  subscription_tier: subscriptionTierEnum('subscription_tier').notNull().default('free'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Products table
export const productsTable = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  asin: text('asin').notNull().unique(),
  title: text('title').notNull(),
  brand: text('brand'),
  category: text('category').notNull(),
  subcategory: text('subcategory'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  sales_rank: integer('sales_rank'),
  rating: numeric('rating', { precision: 3, scale: 2 }),
  review_count: integer('review_count'),
  image_url: text('image_url'),
  keywords: jsonb('keywords').notNull().default('[]'),
  estimated_monthly_sales: integer('estimated_monthly_sales'),
  competition_level: competitionLevelEnum('competition_level'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Collections table (File Manager categories)
export const collectionsTable = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Saved products table
export const savedProductsTable = pgTable('saved_products', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  product_id: uuid('product_id').notNull().references(() => productsTable.id, { onDelete: 'cascade' }),
  collection_id: uuid('collection_id').references(() => collectionsTable.id, { onDelete: 'set null' }),
  notes: text('notes'),
  tags: jsonb('tags').notNull().default('[]'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  collections: many(collectionsTable),
  savedProducts: many(savedProductsTable)
}));

export const productsRelations = relations(productsTable, ({ many }) => ({
  savedProducts: many(savedProductsTable)
}));

export const collectionsRelations = relations(collectionsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [collectionsTable.user_id],
    references: [usersTable.id]
  }),
  savedProducts: many(savedProductsTable)
}));

export const savedProductsRelations = relations(savedProductsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [savedProductsTable.user_id],
    references: [usersTable.id]
  }),
  product: one(productsTable, {
    fields: [savedProductsTable.product_id],
    references: [productsTable.id]
  }),
  collection: one(collectionsTable, {
    fields: [savedProductsTable.collection_id],
    references: [collectionsTable.id]
  })
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type Collection = typeof collectionsTable.$inferSelect;
export type NewCollection = typeof collectionsTable.$inferInsert;
export type SavedProduct = typeof savedProductsTable.$inferSelect;
export type NewSavedProduct = typeof savedProductsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  products: productsTable,
  collections: collectionsTable,
  savedProducts: savedProductsTable
};
