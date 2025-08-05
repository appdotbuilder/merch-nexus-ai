
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { User, Settings, TrendingUp, Calendar, Crown, Star, BarChart3 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User as UserType, UpdateUserProfileInput } from '../../../server/src/schema';

interface UserProfileProps {
  user: UserType | null;
  onUpdateProfile: () => void;
}

export function UserProfile({ user, onUpdateProfile }: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<UpdateUserProfileInput>({
    full_name: user?.full_name || null,
    avatar_url: user?.avatar_url || null
  });

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await trpc.updateUserProfile.mutate(profileData);
      await onUpdateProfile();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'pro': return <Star className="h-4 w-4" />;
      case 'enterprise': return <Crown className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  // Demo stats data
  const stats = {
    productsSearched: 1247,
    productsSaved: 23,
    collectionsCreated: 5,
    monthlySearches: 856,
    conversionRate: 78,
    daysActive: 45
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Data</h3>
          <p className="text-gray-500">Unable to load user profile information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="text-lg">
                    {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('') : user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user.full_name || 'Unnamed User'}
                    </h2>
                    <Badge className={getTierColor(user.subscription_tier)}>
                      {getTierIcon(user.subscription_tier)}
                      <span className="ml-1 capitalize">{user.subscription_tier}</span>
                    </Badge>
                  </div>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">
                    Member since {user.created_at.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.productsSearched.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Products Searched</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Star className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.productsSaved}</p>
                    <p className="text-sm text-gray-600">Products Saved</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Settings className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.collectionsCreated}</p>
                    <p className="text-sm text-gray-600">Collections</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.daysActive}</p>
                    <p className="text-sm text-gray-600">Days Active</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest research actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Star className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Saved "Funny Cat Lover T-Shirt" to High Potential T-Shirts</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Searched for products in "Home & Kitchen" category</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Settings className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Created new collection "Pet Lover Niche"</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Profile Settings</span>
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>
                    {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('') : user.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="full-name"
                        value={profileData.full_name || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setProfileData((prev: UpdateUserProfileInput) => ({ 
                            ...prev, 
                            full_name: e.target.value || null 
                          }))
                        }
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 py-2">{user.full_name || 'Not set'}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <p className="text-sm text-gray-900 py-2">{user.email}</p>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar-url">Avatar URL (optional)</Label>
                  {isEditing ? (
                    <Input
                      id="avatar-url"
                      type="url"
                      value={profileData.avatar_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setProfileData((prev: UpdateUserProfileInput) => ({ 
                          ...prev, 
                          avatar_url: e.target.value || null 
                        }))
                      }
                      placeholder="https://example.com/avatar.jpg"
                    />
                  ) : (
                    <p className="text-sm text-gray-900 py-2">{user.avatar_url || 'Not set'}</p>
                  )}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                {isEditing ? (
                  <div className="space-x-2">
                    <Button 
                      onClick={handleUpdateProfile} 
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsEditing(false);
                        setProfileData({
                          full_name: user.full_name,
                          avatar_url: user.avatar_url
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5" />
                <span>Subscription</span>
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getTierIcon(user.subscription_tier)}
                  <div>
                    <p className="font-medium capitalize">{user.subscription_tier} Plan</p>
                    <p className="text-sm text-gray-600">
                      {user.subscription_tier === 'free' && 'Limited searches per month'}
                      {user.subscription_tier === 'pro' && 'Unlimited searches + advanced filters'}
                      {user.subscription_tier === 'enterprise' && 'Everything + priority support'}
                    </p>
                  </div>
                </div>
                {user.subscription_tier === 'free' && (
                  <Button className="bg-indigo-600 hover:bg-indigo-700">
                    Upgrade Plan 🚀
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Search Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Search Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Searches</span>
                    <span className="font-medium">{stats.monthlySearches}/1000</span>
                  </div>
                  <Progress value={(stats.monthlySearches / 1000) * 100} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Save Rate</span>
                    <span className="font-medium">{stats.conversionRate}%</span>
                  </div>
                  <Progress value={stats.conversionRate} className="h-2" />
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Popular Categories</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Clothing</span>
                      <span className="text-gray-600">45%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Home & Kitchen</span>
                      <span className="text-gray-600">32%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Sports</span>
                      <span className="text-gray-600">23%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">A+</p>
                  <p className="text-sm text-blue-800">Research Score</p>
                  <p className="text-xs text-blue-600 mt-1">Top 10% of users</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">92%</p>
                    <p className="text-xs text-green-800">Success Rate</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">4.8</p>
                    <p className="text-xs text-purple-800">Avg Rating</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">Achievements 🏆</h4>
                  <div className="space-y-2">
                    <Badge variant="secondary" className="mr-2 mb-2">
                      First Collection Created
                    </Badge>
                    <Badge variant="secondary" className="mr-2 mb-2">
                      10 Products Saved
                    </Badge>
                    <Badge variant="secondary" className="mr-2 mb-2">
                      Active User (30 days)
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
