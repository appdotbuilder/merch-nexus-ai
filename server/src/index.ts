
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCollectionInputSchema,
  updateCollectionInputSchema,
  saveProductInputSchema,
  updateSavedProductInputSchema,
  searchProductsInputSchema,
  updateUserProfileInputSchema
} from './schema';

// Import handlers
import { getUserProfile } from './handlers/get_user_profile';
import { updateUserProfile } from './handlers/update_user_profile';
import { searchProducts } from './handlers/search_products';
import { getProductById } from './handlers/get_product_by_id';
import { createCollection } from './handlers/create_collection';
import { getUserCollections } from './handlers/get_user_collections';
import { updateCollection } from './handlers/update_collection';
import { deleteCollection } from './handlers/delete_collection';
import { saveProduct } from './handlers/save_product';
import { getSavedProducts } from './handlers/get_saved_products';
import { updateSavedProduct } from './handlers/update_saved_product';
import { removeSavedProduct } from './handlers/remove_saved_product';

// Define context type
type Context = {
  userId: string;
};

// Context with user authentication
const createContext = (): Context => {
  // This would typically extract user info from auth headers/tokens
  return {
    userId: 'placeholder-user-id' // In real implementation, extract from JWT/session
  };
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User profile routes
  getUserProfile: publicProcedure
    .query(({ ctx }) => getUserProfile(ctx.userId)),

  updateUserProfile: publicProcedure
    .input(updateUserProfileInputSchema)
    .mutation(({ input, ctx }) => updateUserProfile(ctx.userId, input)),

  // Product search routes
  searchProducts: publicProcedure
    .input(searchProductsInputSchema)
    .query(({ input }) => searchProducts(input)),

  getProductById: publicProcedure
    .input(z.object({ productId: z.string().uuid() }))
    .query(({ input }) => getProductById(input.productId)),

  // Collection management routes
  createCollection: publicProcedure
    .input(createCollectionInputSchema)
    .mutation(({ input, ctx }) => createCollection(ctx.userId, input)),

  getUserCollections: publicProcedure
    .query(({ ctx }) => getUserCollections(ctx.userId)),

  updateCollection: publicProcedure
    .input(updateCollectionInputSchema)
    .mutation(({ input, ctx }) => updateCollection(ctx.userId, input)),

  deleteCollection: publicProcedure
    .input(z.object({ collectionId: z.string().uuid() }))
    .mutation(({ input, ctx }) => deleteCollection(ctx.userId, input.collectionId)),

  // Saved products routes
  saveProduct: publicProcedure
    .input(saveProductInputSchema)
    .mutation(({ input, ctx }) => saveProduct(ctx.userId, input)),

  getSavedProducts: publicProcedure
    .input(z.object({ collectionId: z.string().uuid().optional() }).optional())
    .query(({ input, ctx }) => getSavedProducts(ctx.userId, input?.collectionId)),

  updateSavedProduct: publicProcedure
    .input(updateSavedProductInputSchema)
    .mutation(({ input, ctx }) => updateSavedProduct(ctx.userId, input)),

  removeSavedProduct: publicProcedure
    .input(z.object({ savedProductId: z.string().uuid() }))
    .mutation(({ input, ctx }) => removeSavedProduct(ctx.userId, input.savedProductId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext,
  });
  server.listen(port);
  console.log(`Merch Nexus AI TRPC server listening at port: ${port}`);
}

start();
