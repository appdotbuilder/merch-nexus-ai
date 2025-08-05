
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  subscription_tier: z.enum(['free', 'pro', 'enterprise']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Product schema
export const productSchema = z.object({
  id: z.string().uuid(),
  asin: z.string(),
  title: z.string(),
  brand: z.string().nullable(),
  category: z.string(),
  subcategory: z.string().nullable(),
  price: z.number(),
  sales_rank: z.number().int().nullable(),
  rating: z.number().nullable(),
  review_count: z.number().int().nullable(),
  image_url: z.string().url().nullable(),
  keywords: z.array(z.string()),
  estimated_monthly_sales: z.number().int().nullable(),
  competition_level: z.enum(['low', 'medium', 'high']).nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Collection schema (File Manager categories)
export const collectionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Collection = z.infer<typeof collectionSchema>;

// Saved product schema (products saved to collections)
export const savedProductSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  product_id: z.string().uuid(),
  collection_id: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  tags: z.array(z.string()),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type SavedProduct = z.infer<typeof savedProductSchema>;

// Input schemas
export const createCollectionInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional()
});

export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;

export const updateCollectionInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional()
});

export type UpdateCollectionInput = z.infer<typeof updateCollectionInputSchema>;

export const saveProductInputSchema = z.object({
  product_id: z.string().uuid(),
  collection_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

export type SaveProductInput = z.infer<typeof saveProductInputSchema>;

export const updateSavedProductInputSchema = z.object({
  id: z.string().uuid(),
  collection_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  tags: z.array(z.string()).optional()
});

export type UpdateSavedProductInput = z.infer<typeof updateSavedProductInputSchema>;

export const searchProductsInputSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  min_rating: z.number().optional(),
  competition_level: z.enum(['low', 'medium', 'high']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export type SearchProductsInput = z.infer<typeof searchProductsInputSchema>;

export const updateUserProfileInputSchema = z.object({
  full_name: z.string().nullable().optional(),
  avatar_url: z.string().url().nullable().optional()
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileInputSchema>;
