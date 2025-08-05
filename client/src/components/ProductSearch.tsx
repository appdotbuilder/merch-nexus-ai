
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Star, Heart, ExternalLink, TrendingUp, DollarSign } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Product, SearchProductsInput } from '../../../server/src/schema';

export function ProductSearch() {
  const [searchResults, setSearchResults] = useState<{ products: Product[]; total: number }>({
    products: [],
    total: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams, setSearchParams] = useState<SearchProductsInput>({
    query: '',
    category: undefined,
    min_price: undefined,
    max_price: undefined,
    min_rating: undefined,
    competition_level: undefined,
    page: 1,
    limit: 20
  });

  // Demo data since backend is stubbed - memoized to avoid dependency issues
  const demoProducts: Product[] = useMemo(() => [
    {
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
    },
    {
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
    },
    {
      id: '3',
      asin: 'B07XFGH456',
      title: 'Motivational Workout Tank Top',
      brand: 'FitGear',
      category: 'Clothing',
      subcategory: 'Athletic Wear',
      price: 22.99,
      sales_rank: 25000,
      rating: 4.1,
      review_count: 95,
      image_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
      keywords: ['workout', 'motivation', 'fitness', 'tank top'],
      estimated_monthly_sales: 280,
      competition_level: 'high',
      created_at: new Date('2024-01-20'),
      updated_at: new Date('2024-01-20')
    }
  ], []);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await trpc.searchProducts.query(searchParams);
      // Since backend is stubbed, show demo data when searching
      if (searchParams.query || searchParams.category) {
        setSearchResults({
          products: demoProducts.filter(p => 
            !searchParams.query || 
            p.title.toLowerCase().includes(searchParams.query.toLowerCase()) ||
            p.keywords.some(k => k.toLowerCase().includes(searchParams.query!.toLowerCase()))
          ),
          total: demoProducts.length
        });
      } else {
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to demo data on error
      setSearchResults({ products: demoProducts, total: demoProducts.length });
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, demoProducts]);

  const handleSaveProduct = async (productId: string) => {
    try {
      await trpc.saveProduct.mutate({
        product_id: productId,
        collection_id: null,
        notes: null,
        tags: []
      });
      // Show success message (could use toast here)
      console.log('Product saved successfully');
    } catch (error) {
      console.error('Failed to save product:', error);
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

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Search & Filter Products</span>
          </CardTitle>
          <CardDescription>
            Find profitable products using advanced search criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search-query">Search Query</Label>
              <Input
                id="search-query"
                placeholder="Enter keywords, ASIN, or product title..."
                value={searchParams.query || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchParams((prev: SearchProductsInput) => ({ ...prev, query: e.target.value || undefined }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={searchParams.category || 'all'}
                onValueChange={(value: string) =>
                  setSearchParams((prev: SearchProductsInput) => ({ ...prev, category: value === 'all' ? undefined : value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="Clothing">Clothing</SelectItem>
                  <SelectItem value="Home & Kitchen">Home & Kitchen</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Competition Level</Label>
              <Select
                value={searchParams.competition_level || 'any'}
                onValueChange={(value: string) =>
                  setSearchParams((prev: SearchProductsInput) => ({ 
                    ...prev, 
                    competition_level: value === 'any' ? undefined : value as 'low' | 'medium' | 'high'
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any level</SelectItem>
                  <SelectItem value="low">Low Competition</SelectItem>
                  <SelectItem value="medium">Medium Competition</SelectItem>
                  <SelectItem value="high">High Competition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Price Range: ${searchParams.min_price || 0} - ${searchParams.max_price || 100}</Label>
              <div className="px-2">
                <Slider
                  value={[searchParams.min_price || 0, searchParams.max_price || 100]}
                  onValueChange={([min, max]: number[]) =>
                    setSearchParams((prev: SearchProductsInput) => ({ ...prev, min_price: min, max_price: max }))
                  }
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Minimum Rating: {searchParams.min_rating || 0} stars</Label>
              <div className="px-2">
                <Slider
                  value={[searchParams.min_rating || 0]}
                  onValueChange={([rating]: number[]) =>
                    setSearchParams((prev: SearchProductsInput) => ({ ...prev, min_rating: rating }))
                  }
                  max={5}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <Button onClick={handleSearch} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
              {isLoading ? 'Searching...' : 'Search Products'} 🔍
            </Button>
            <Button
              variant="outline"
              onClick={() => setSearchParams({
                query: '',
                category: undefined,
                min_price: undefined,
                max_price: undefined,
                min_rating: undefined,
                competition_level: undefined,
                page: 1,
                limit: 20
              })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.products.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Search Results ({searchResults.total} products found)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.products.map((product: Product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="aspect-square rounded-md overflow-hidden bg-gray-100 mb-3">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop'}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardTitle className="text-sm line-clamp-2">{product.title}</CardTitle>
                  {product.brand && (
                    <CardDescription className="text-xs">{product.brand}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.rating && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        {product.review_count && (
                          <span className="text-xs text-gray-500">({product.review_count})</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    {product.competition_level && (
                      <Badge className={`text-xs ${getCompetitionColor(product.competition_level)}`}>
                        {product.competition_level} competition
                      </Badge>
                    )}
                  </div>

                  {product.estimated_monthly_sales && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>~{product.estimated_monthly_sales} sales/month</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSaveProduct(product.id)}
                      className="flex-1"
                    >
                      <Heart className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a
                        href={`https://amazon.com/dp/${product.asin}`}
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
        </div>
      )}

      {searchResults.products.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Find Winning Products?</h3>
            <p className="text-gray-500 mb-4">
              Use the search filters above to discover profitable products for your Merch by Amazon business.
            </p>
            <Button onClick={handleSearch} className="bg-indigo-600 hover:bg-indigo-700">
              Start Searching 🚀
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
