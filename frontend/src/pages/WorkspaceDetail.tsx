import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FolderOpen, 
  Search, 
  Upload, 
  Play, 
  Clock, 
  Calendar,
  Eye,
  MoreHorizontal,
  Plus,
  TrendingUp,
  FileText,
  Loader2,
  Trash2
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { podcastApi } from "@/services/podcastApi";
import { toast } from "sonner";
import { DeleteEpisodeModal } from "@/components/DeleteEpisodeModal";

const WorkspaceDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const { workspaces } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    episodeId: string;
    episodeTitle: string;
    isDeleting: boolean;
  }>({ isOpen: false, episodeId: '', episodeTitle: '', isDeleting: false });

  // Find the current workspace from context
  const workspace = workspaces.find(w => w.id === id);

  // Fetch episodes for this workspace
  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!id || !currentUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const episodeData = await podcastApi.getWorkspaceEpisodes(id);
        setEpisodes(episodeData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch episodes');
        toast.error('Failed to load episodes');
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, [id, currentUser]);

  // Helper function to extract title from episode data
  const getEpisodeTitle = (episode: any) => {
    return episode.gemini_seo_content?.seo_title || episode.filename || 'Untitled Episode';
  };

  // Helper function to get episode duration from metadata
  const getEpisodeDuration = (episode: any) => {
    // Try different possible locations for duration in seconds
    let durationInSeconds = null;
    
    // Check various possible locations for duration data
    if (episode.deepgram_data?.words && episode.deepgram_data.words.length > 0) {
      // Get duration from last word's end time
      const lastWord = episode.deepgram_data.words[episode.deepgram_data.words.length - 1];
      durationInSeconds = lastWord.end;
    } else if (episode.transcript?.metadata?.duration) {
      durationInSeconds = episode.transcript.metadata.duration;
    } else if (episode.processing_info?.duration) {
      durationInSeconds = episode.processing_info.duration;
    } else if (episode.metadata?.duration) {
      durationInSeconds = episode.metadata.duration;
    }
    
    if (durationInSeconds && durationInSeconds > 0) {
      const totalMinutes = Math.floor(durationInSeconds / 60);
      const seconds = Math.floor(durationInSeconds % 60);
      
      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
      } else {
        return `${totalMinutes}m`;
      }
    }
    
    return 'Unknown'; // Show unknown instead of fake duration
  };

  // Helper function to format upload date
  const formatUploadDate = (episode: any) => {
    // Try different possible date formats
    let dateStr = episode.created_at || episode.metadata?.created_at;
    
    if (dateStr) {
      let date;
      
      // Handle Firestore timestamp format
      if (typeof dateStr === 'object' && dateStr.seconds) {
        date = new Date(dateStr.seconds * 1000);
      } else if (typeof dateStr === 'string') {
        date = new Date(dateStr);
      } else {
        date = new Date(dateStr);
      }
      
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const episodeDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        // Check if the episode was created today
        if (episodeDate.getTime() === today.getTime()) {
          // Show exact time only (e.g., "2:35 PM")
          return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } else {
          // Show full date and time (e.g., "July 29, 2025 – 10:12 AM")
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) + ' – ' + date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        }
      }
    }
    return 'Unknown date';
  };

  // Helper function to open delete modal
  const openDeleteModal = (episodeId: string, episodeTitle: string) => {
    setDeleteModal({
      isOpen: true,
      episodeId,
      episodeTitle,
      isDeleting: false
    });
  };

  // Helper function to close delete modal
  const closeDeleteModal = () => {
    if (!deleteModal.isDeleting) {
      setDeleteModal({
        isOpen: false,
        episodeId: '',
        episodeTitle: '',
        isDeleting: false
      });
    }
  };

  // Helper function to delete an episode
  const confirmDeleteEpisode = async () => {
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    
    try {
      console.log(`Attempting to delete episode: ${deleteModal.episodeId}`);
      

      
      // Call delete API endpoint
      await podcastApi.deletePodcast(deleteModal.episodeId);
      
      // Remove from local state
      setEpisodes(episodes.filter(ep => ep.id !== deleteModal.episodeId));
      
      toast.success('Episode deleted successfully');
      
      // Close modal
      closeDeleteModal();
    } catch (error) {
      console.error('Failed to delete episode:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete episode';
      toast.error(`Deletion failed: ${errorMessage}`);
      
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const filteredEpisodes = episodes.filter(episode => {
    const title = getEpisodeTitle(episode);
    const description = episode.seo_content?.show_notes || episode.transcript?.full_text || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           description.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Calculate real total duration from episodes
  const calculateTotalDuration = () => {
    let totalSeconds = 0;
    episodes.forEach(episode => {
      if (episode.deepgram_data?.words && episode.deepgram_data.words.length > 0) {
        const lastWord = episode.deepgram_data.words[episode.deepgram_data.words.length - 1];
        totalSeconds += lastWord.end || 0;
      }
    });
    
    if (totalSeconds > 0) {
      const totalMinutes = Math.floor(totalSeconds / 60);
      if (totalMinutes >= 60) {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
      } else {
        return `${totalMinutes}m`;
      }
    }
    return '0m';
  };

  // Calculate total content items generated across all episodes
  const calculateTotalContentItems = () => {
    let totalItems = 0;
    
    episodes.forEach(episode => {
      // Count SEO Blog (if exists)
      if (episode.gemini_seo_content?.blog_post || episode.seo_content?.blog_post) {
        totalItems += 1;
      }
      
      // Count Show Notes (if exists)
      if (episode.gemini_seo_content?.show_notes || episode.seo_content?.show_notes) {
        totalItems += 1;
      }
      
      // Count Social Media Posts (count each post individually)
      const socialPosts = episode.gemini_seo_content?.social_media_posts || episode.seo_content?.social_media_posts;
      if (socialPosts) {
        if (Array.isArray(socialPosts)) {
          totalItems += socialPosts.length; // Count each post
        } else if (typeof socialPosts === 'object') {
          // If it's an object with platform keys, count each platform
          totalItems += Object.keys(socialPosts).length;
        }
      }
      
      // Count Transcript (if exists)
      if (episode.transcript?.full_text) {
        totalItems += 1;
      }
      
      // Count Metadata (if exists and has meaningful content)
      if (episode.metadata || episode.processing_info) {
        totalItems += 1;
      }
    });
    
    return totalItems;
  };

  const stats = [
    { title: "Total Episodes", value: episodes.length, icon: Play },
    { title: "Total Duration", value: calculateTotalDuration(), icon: Clock },
    { title: "Content Generated", value: calculateTotalContentItems(), icon: FileText }
  ];

  // Show loading state if workspace is not found yet
  if (!workspace && !loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Workspace not found</h3>
          <p className="text-gray-600 mb-4">The workspace you're looking for doesn't exist or you don't have access to it.</p>
          <Link to="/workspaces">
            <Button>Back to Workspaces</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <FolderOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workspace?.name || 'Loading...'}</h1>
            {workspace?.description ? (
              <p className="text-gray-600 mt-1 max-w-2xl">{workspace.description}</p>
            ) : (
              <p className="text-gray-400 italic mt-1 max-w-2xl">—</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="text-sm text-gray-500">Created {workspace?.created_at ? new Date(workspace.created_at).toLocaleDateString() : 'Unknown'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <MoreHorizontal className="h-4 w-4 mr-2" />
            Manage
          </Button>
          <Link to="/upload">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <Upload className="h-4 w-4 mr-2" />
              Upload Episode
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Episodes Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="text-xl">Episodes</CardTitle>
              <CardDescription>Manage and view your podcast episodes</CardDescription>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search episodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Link to="/upload">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Episode
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading episodes...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">{error}</div>
              <Button onClick={() => window.location.reload()} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEpisodes.map((episode) => {
                const title = getEpisodeTitle(episode);
                const duration = getEpisodeDuration(episode);
                const uploadedAt = formatUploadDate(episode);
                const status = episode.metadata?.processing_status || 'processing';
                const hasContent = !!episode.seo_content;
                
                return (
                  <div key={episode.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <Play className="h-5 w-5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {title}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {episode.transcript?.full_text?.substring(0, 100) || 'No description available'}...
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {duration}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {uploadedAt}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Link to={`/episode/${episode.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Content
                        </Button>
                      </Link>
                      
                      <div className="relative group">
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                        
                        {/* Dropdown Menu */}
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="py-1">
                            <Link 
                              to={`/episode/${episode.id}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-3" />
                              View Details
                            </Link>
                            <button 
                              onClick={() => openDeleteModal(episode.id, title)}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-4 w-4 mr-3" />
                              Delete Episode
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {filteredEpisodes.length === 0 && (
            <div className="text-center py-12">
              <Play className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No episodes found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Upload your first episode to get started"}
              </p>
              <Link to="/upload">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Episode
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Delete Episode Modal */}
      <DeleteEpisodeModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteEpisode}
        episodeTitle={deleteModal.episodeTitle}
        isDeleting={deleteModal.isDeleting}
      />
    </div>
  );
};

export default WorkspaceDetail;
