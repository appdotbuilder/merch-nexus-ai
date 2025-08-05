
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Plus, Folder, Edit, Trash2, Star, ExternalLink, Tag } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Collection, SavedProduct, Product, CreateCollectionInput } from '../../../server/src/schema';

interface SavedProductWithProduct extends SavedProduct {
  product: Product;
}

export function FileManager() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedProducts, setSavedProducts] = useState<SavedProductWithProduct[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCollection, setNewCollection] = useState<CreateCollectionInput>({
    name: '',
    description: null,
    color: null
  });

  // Demo data since backend is stubbed - memoized to avoid dependency issues
  const demoCollections: Collection[] = useMemo(() => [
    {
      id: '1',
      user_id: 'user-1',
      name: 'High Potential T-Shirts',
      description: 'Trending t-shirt designs with low competition',
      color: '#10B981',
      created_at: new Date('2024-01-15'),
      updated_at: new Date('2024-01-15')
    },
    {
      id: '2',
      user_id: 'user-1',
      name: 'Home Decor Winners',
      description: 'Profitable home decor items for Q2',
      color: '#F59E0B',
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20')
    },
    {
      id: '3',
      user_id: 'user-1',
      name: 'Pet Lover Niche',
      description: 'Pet-themed products with great reviews',
      color: '#8B5CF6',
      created_at: new Date('2024-01-25'),
      updated_at: new Date('2024-01-25')
    }
  ], []);

  const demoSavedProducts: SavedProductWithProduct[] = useMemo(() => [
    {
      id: '1',
      user_id: 'user-1',
      product_id: '1',
      collection_id: '1',
      notes: 'Great design potential, low competition in cat niche',
      tags: ['trending', 'cat', 'funny'],
      created_at: new Date('2024-01-16'),
      updated_at: new Date('2024-01-16'),
      product: {
        id: '1',
        asin: 'B08N5WRWNW',
        title: 'Funny Cat Lover T-Shirt - Meow Life',
        brand: 'MerchMaster',
        category: 'Clothing',
        subcategory: 'T-Shirts',
        price: 19.99,
        sales_rank: 15000,
        rating: 4.3,
        review_count: 127,
        image_url: 'https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=300&h=300&fit=crop',
        keywords: ['cat', 'funny', 't-shirt', 'pet lover'],
        estimated_monthly_sales: 450,
        competition_level: 'medium',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15')
      }
    },
    {
      id: '2',
      user_id: 'user-1',
      product_id: '2',
      collection_id: '2',
      notes: 'Vintage trend is hot, good profit margins',
      tags: ['vintage', 'coffee', 'bestseller'],
      created_at: new Date('2024-01-21'),
      updated_at: new Date('2024-01-21'),
      product: {
        id: '2',
        asin: 'B09KBCD123',
        title: 'Vintage Sunset Coffee Mug',
        brand: 'RetroVibes',
        category: 'Home & Kitchen',
        subcategory: 'Mugs',
        price: 14.99,
        sales_rank: 8500,
        rating: 4.7,
        review_count: 289,
        image_url: 'https://images.unsplash.com/photo-1514228742587-6b1558fcf93a?w=300&h=300&fit=crop',
        keywords: ['coffee', 'vintage', 'sunset', 'mug'],
        estimated_monthly_sales: 720,
        competition_level: 'low',
        created_at: new Date('2024-01-10'),
        updated_at: new Date('2024-01-10')
      }
    }
  ], []);

  const loadCollections = useCallback(async () => {
    try {
      const result = await trpc.getUserCollections.query();
      // Since backend is stubbed, show demo data
      setCollections(result.length > 0 ? result : demoCollections);
    } catch (error) {
      console.error('Failed to load collections:', error);
      setCollections(demoCollections);
    }
  }, [demoCollections]);

  const loadSavedProducts = useCallback(async (collectionId?: string) => {
    try {
      setIsLoading(true);
      const result = await trpc.getSavedProducts.query({ collectionId });
      // Since backend is stubbed, filter demo data
      const filteredProducts = collectionId 
        ? demoSavedProducts.filter(p => p.collection_id === collectionId)
        : demoSavedProducts;
      setSavedProducts(result.length > 0 ? result as SavedProductWithProduct[] : filteredProducts);
    } catch (error) {
      console.error('Failed to load saved products:', error);
      const filteredProducts = selectedCollection 
        ? demoSavedProducts.filter(p => p.collection_id === selectedCollection)
        : demoSavedProducts;
      setSavedProducts(filteredProducts);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCollection, demoSavedProducts]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    loadSavedProducts(selectedCollection || undefined);
  }, [loadSavedProducts, selectedCollection]);

  const handleCreateCollection = async () => {
    try {
      const result = await trpc.createCollection.mutate(newCollection);
      setCollections((prev: Collection[]) => [...prev, result]);
      setNewCollection({ name: '', description: null, color: null });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create collection:', error);
      // Demo: Add to local state
      const newCol: Collection = {
        id: Math.random().toString(),
        user_id: 'user-1',
        name: newCollection.name,
        description: newCollection.description || null,
        color: newCollection.color || null,
        created_at: new Date(),
        updated_at: new Date()
      };
      setCollections((prev: Collection[]) => [...prev, newCol]);
      setNewCollection({ name: '', description: null, color: null });
      setIsCreateDialogOpen(false);
    }
  };

  const handleDeleteProduct = async (savedProductId: string) => {
    try {
      await trpc.removeSavedProduct.mutate({ savedProductId });
      setSavedProducts((prev: SavedProductWithProduct[]) => 
        prev.filter(p => p.id !== savedProductId)
      );
    } catch (error) {
      console.error('Failed to delete product:', error);
      // Demo: Remove from local state
      setSavedProducts((prev: SavedProductWithProduct[]) => 
        prev.filter(p => p.id !== savedProductId)
      );
    }
  };

  const getCompetitionColor = (level: string | null) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const colorOptions = [
    { value: '#10B981', label: 'Green', class: 'bg-green-500' },
    { value: '#F59E0B', label: 'Yellow', class: 'bg-yellow-500' },
    { value: '#8B5CF6', label: 'Purple', class: 'bg-purple-500' },
    { value: '#EF4444', label: 'Red', class: 'bg-red-500' },
    { value: '#3B82F6', label: 'Blue', class: 'bg-blue-500' },
    { value: '#F97316', label: 'Orange', class: 'bg-orange-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Collections Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Collections</h2>
          <p className="text-gray-600">Organize your research into categories</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Collection</DialogTitle>
              <DialogDescription>
                Organize your saved products into themed collections
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="collection-name">Collection Name</Label>
                <Input
                  id="collection-name"
                  placeholder="e.g., High Potential T-Shirts"
                  value={newCollection.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewCollection((prev: CreateCollectionInput) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="collection-description">Description (optional)</Label>
                <Textarea
                  id="collection-description"
                  placeholder="Describe what products you'll save here..."
                  value={newCollection.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewCollection((prev: CreateCollectionInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color (optional)</Label>
                <div className="flex space-x-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color.class} ${
                        newCollection.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      onClick={() =>
                        setNewCollection((prev: CreateCollectionInput) => ({ 
                          ...prev, 
                          color: color.value 
                        }))
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreateCollection}
                disabled={!newCollection.name.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                Create Collection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${
            selectedCollection === null ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'
          }`}
          onClick={() => setSelectedCollection(null)}
        >
          <CardContent className="p-6 text-center">
            <Folder className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900">All Products</h3>
            <p className="text-sm text-gray-500">View all saved products</p>
            <Badge variant="secondary" className="mt-2">
              {demoSavedProducts.length} products
            </Badge>
          </CardContent>
        </Card>

        {collections.map((collection: Collection) => (
          <Card
            key={collection.id}
            className={`cursor-pointer transition-all ${
              selectedCollection === collection.id ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedCollection(collection.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: collection.color || '#6B7280' }}
                />
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{collection.name}</h3>
              {collection.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{collection.description}</p>
              )}
              <Badge variant="secondary">
                {demoSavedProducts.filter(p => p.collection_id === collection.id).length} products
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Saved Products */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {selectedCollection 
              ? `${collections.find(c => c.id === selectedCollection)?.name || 'Collection'} Products`
              : 'All Saved Products'
            }
          </h3>
          <span className="text-sm text-gray-500">
            {savedProducts.length} products
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading products...</p>
          </div>
        ) : savedProducts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Products</h3>
              <p className="text-gray-500 mb-4">
                Start saving products from your search results to organize your research.
              </p>
              <Button variant="outline">
                Go to Product Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedProducts.map((savedProduct: SavedProductWithProduct) => (
              <Card key={savedProduct.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="aspect-square rounded-md overflow-hidden bg-gray-100 mb-3">
                    <img
                      src={savedProduct.product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop'}
                      alt={savedProduct.product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-sm line-clamp-2">{savedProduct.product.title}</CardTitle>
                  {savedProduct.product.brand && (
                    <CardDescription className="text-xs">{savedProduct.product.brand}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      ${savedProduct.product.price.toFixed(2)}
                    </span>
                    {savedProduct.product.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{savedProduct.product.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {savedProduct.product.category}
                    </Badge>
                    {savedProduct.product.competition_level && (
                      <Badge className={`text-xs ${getCompetitionColor(savedProduct.product.competition_level)}`}>
                        {savedProduct.product.competition_level}
                      </Badge>
                    )}
                  </div>

                  {savedProduct.notes && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                      <strong>Notes:</strong> {savedProduct.notes}
                    </div>
                  )}

                  {savedProduct.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {savedProduct.tags.map((tag: string) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-gray-400">
                    Saved: {savedProduct.created_at.toLocaleDateString()}
                  </p>

                  <Separator />

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteProduct(savedProduct.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`https://amazon.com/dp/${savedProduct.product.asin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
