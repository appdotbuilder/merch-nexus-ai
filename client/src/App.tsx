
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertCircle, Search, BookOpen, User, TrendingUp, Package } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { ProductSearch } from '@/components/ProductSearch';
import { FileManager } from '@/components/FileManager';
import { UserProfile } from '@/components/UserProfile';
import type { User as UserType } from '../../server/src/schema';

function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('search');

  const loadUserProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const profile = await trpc.getUserProfile.query();
      setUser(profile);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600">Loading Merch Nexus AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Merch Nexus AI</h1>
                <p className="text-sm text-gray-500">Amazon Research Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || undefined} />
                    <AvatarFallback>
                      {user.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('') : user.email[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.full_name || user.email}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {user.subscription_tier}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Backend Stub Warning */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Demo Mode:</strong> This application uses stub data as the backend handlers are not fully implemented. 
            The frontend demonstrates the complete workflow for product research, collection management, and user profiles.
          </AlertDescription>
        </Alert>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Product Search</span>
            </TabsTrigger>
            <TabsTrigger value="manager" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>File Manager</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Discover Winning Products 🚀
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Search and analyze thousands of Amazon products to find your next bestseller. 
                Use advanced filters to discover low-competition, high-demand opportunities.
              </p>
            </div>
            <ProductSearch />
          </TabsContent>

          <TabsContent value="manager" className="space-y-6">
            <div className="text-center py-8">
              <BookOpen className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Organize Your Research 📋
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Save promising products to collections, add notes, and track your research progress. 
                Keep your best finds organized for easy review and decision making.
              </p>
            </div>
            <FileManager />
          </TabsContent>

          <TabsContent value="profile" className="space-y-6">
            <div className="text-center py-8">
              <User className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Your Dashboard 👤
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Manage your account settings, subscription, and track your research activity. 
                Customize your experience to match your selling strategy.
              </p>
            </div>
            <UserProfile user={user} onUpdateProfile={loadUserProfile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
