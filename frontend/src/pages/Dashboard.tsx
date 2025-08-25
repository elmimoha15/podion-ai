
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  Mic, 
  FileText, 
  Share2, 
  BarChart3, 
  Clock, 
  Users,
  TrendingUp,
  Calendar,
  Play,
  MoreVertical,
  Eye,
  Download,
  FolderOpen,
  Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { podcastApi } from "@/services/podcastApi";
import { toast } from "sonner";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [recentEpisodes, setRecentEpisodes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch user stats and recent episodes in parallel
        const [statsResponse, episodesResponse] = await Promise.all([
          podcastApi.getUserStats(currentUser.uid),
          podcastApi.getRecentEpisodes(currentUser.uid, 5)
        ]);
        
        if (statsResponse.success) {
          setStats(statsResponse.stats);
        } else {
          console.warn('Failed to fetch stats:', statsResponse.error);
        }
        
        setRecentEpisodes(episodesResponse);
        
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser?.uid]);

  // Helper function to calculate content stats from episodes
  const calculateContentStats = () => {
    if (!recentEpisodes.length) return { totalContent: 0, socialPosts: 0, blogPosts: 0 };
    
    let totalContent = 0;
    let socialPosts = 0;
    let blogPosts = 0;
    
    recentEpisodes.forEach(episode => {
      // Count SEO content items
      if (episode.seo_content) {
        // Count blog posts
        if (episode.seo_content.blog_post) {
          // Handle different blog_post data types
          const blogPostExists = typeof episode.seo_content.blog_post === 'string' 
            ? episode.seo_content.blog_post.trim().length > 0
            : episode.seo_content.blog_post !== null && episode.seo_content.blog_post !== undefined;
          
          if (blogPostExists) {
            blogPosts++;
            totalContent++;
          }
        }
        
        // Count social media posts
        if (episode.seo_content.social_media_posts) {
          if (Array.isArray(episode.seo_content.social_media_posts)) {
            const validSocialPosts = episode.seo_content.social_media_posts.filter(post => 
              post && typeof post === 'string' && post.trim()
            );
            socialPosts += validSocialPosts.length;
            totalContent += validSocialPosts.length;
          } else if (typeof episode.seo_content.social_media_posts === 'string' && episode.seo_content.social_media_posts.trim()) {
            socialPosts += 1;
            totalContent += 1;
          }
        }
        
        // Count show notes from SEO content
        if (episode.seo_content.show_notes && episode.seo_content.show_notes.length > 0) {
          totalContent++;
        }
      }
      
      // Count transcript
      if (episode.transcript && (episode.transcript.text || episode.transcript.words)) {
        totalContent++;
      }
      
      // Count standalone show notes
      if (episode.show_notes && Array.isArray(episode.show_notes) && episode.show_notes.length > 0) {
        totalContent++;
      }
      
      // Count metadata (title, description, etc.)
      if (episode.metadata && (episode.metadata.title || episode.metadata.description)) {
        totalContent++;
      }
    });
    
    return { totalContent, socialPosts, blogPosts };
  };

  const contentStats = calculateContentStats();

  // Format date helper
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    let date: Date;
    if (typeof timestamp === 'object' && timestamp.seconds) {
      // Firestore timestamp
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen blue-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen blue-gradient-soft">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Welcome back! Here's an overview of your podcast content performance.
          </p>
          {error && (
            <div className="mt-2 text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Episodes</CardTitle>
              <Mic className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.total_podcasts || recentEpisodes.length || 0}
              </div>
              <p className="text-xs text-emerald-600 font-medium">
                {recentEpisodes.length > 0 ? `${recentEpisodes.length} recent` : 'No episodes yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Content Generated</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {contentStats.totalContent}
              </div>
              <p className="text-xs text-emerald-600 font-medium">
                {contentStats.blogPosts} blog posts, {contentStats.socialPosts} social posts
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Social Posts</CardTitle>
              <Share2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {contentStats.socialPosts}
              </div>
              <p className="text-xs text-emerald-600 font-medium">
                From {recentEpisodes.length} episodes
              </p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Storage Used</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {stats?.total_storage_mb ? `${stats.total_storage_mb}MB` : '0MB'}
              </div>
              <p className="text-xs text-emerald-600 font-medium">
                {stats?.total_transcript_words ? `${stats.total_transcript_words.toLocaleString()} words` : 'No transcripts'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-effect border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription>Get started with creating content from your podcasts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/upload">
                <Button className="w-full h-20 blue-gradient text-white shadow-lg">
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6" />
                    <span className="font-semibold">Upload Episode</span>
                  </div>
                </Button>
              </Link>
              
              <Link to="/workspaces">
                <Button variant="outline" className="w-full h-20 border-2 border-blue-200 hover:bg-blue-50">
                  <div className="flex flex-col items-center gap-2">
                    <FolderOpen className="h-6 w-6 text-blue-600" />
                    <span className="font-semibold text-blue-700">Browse Workspaces</span>
                  </div>
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full h-20 border-2 border-blue-200 hover:bg-blue-50">
                <div className="flex flex-col items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  <span className="font-semibold text-blue-700">View Analytics</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="glass-effect border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Recent Episodes</CardTitle>
              <CardDescription>Your latest uploaded episodes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentEpisodes.length > 0 ? (
                recentEpisodes.map((episode, index) => {
                  const episodeTitle = episode.metadata?.title || 
                                     episode.filename?.replace(/\.[^/.]+$/, "") || 
                                     'Untitled Episode';
                  const workspaceName = episode.workspace_name || 'Default Workspace';
                  const createdDate = formatDate(episode.metadata?.created_at || episode.created_at);
                  const hasContent = episode.seo_content || episode.transcript;
                  
                  return (
                    <Link 
                      key={episode.id || index} 
                      to={`/episode/${episode.id}`}
                      className="block hover:bg-blue-50/50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Play className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{episodeTitle}</h4>
                            <p className="text-sm text-gray-500">{workspaceName} • {createdDate}</p>
                          </div>
                        </div>
                        <Badge variant={hasContent ? "default" : "secondary"}>
                          {hasContent ? "Content Ready" : "Processing"}
                        </Badge>
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Mic className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No episodes yet</h3>
                  <p className="text-gray-500 mb-4">Upload your first podcast episode to get started</p>
                  <Link to="/upload">
                    <Button className="blue-gradient text-white">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Episode
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">Content Performance</CardTitle>
              <CardDescription>How your generated content is performing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Blog Posts</span>
                  <span className="text-sm text-gray-500">{contentStats.blogPosts} generated</span>
                </div>
                <Progress value={contentStats.blogPosts > 0 ? 85 : 0} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {contentStats.blogPosts > 0 ? 'SEO-optimized content ready' : 'No blog posts yet'}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Social Media Posts</span>
                  <span className="text-sm text-gray-500">{contentStats.socialPosts} created</span>
                </div>
                <Progress value={contentStats.socialPosts > 0 ? 90 : 0} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {contentStats.socialPosts > 0 ? 'Ready for social platforms' : 'No social posts yet'}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Transcripts</span>
                  <span className="text-sm text-gray-500">{recentEpisodes.filter(e => e.transcript).length} episodes</span>
                </div>
                <Progress value={recentEpisodes.length > 0 ? (recentEpisodes.filter(e => e.transcript).length / recentEpisodes.length) * 100 : 0} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.total_transcript_words ? `${stats.total_transcript_words.toLocaleString()} words transcribed` : 'No transcripts yet'}
                </p>
              </div>

              <Separator />

              <div className="flex items-center gap-4 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats?.total_podcasts || 0}</div>
                  <div className="text-xs text-gray-500">Episodes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">{contentStats.totalContent}</div>
                  <div className="text-xs text-gray-500">Content Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats?.total_storage_mb || 0}</div>
                  <div className="text-xs text-gray-500">MB Storage</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
