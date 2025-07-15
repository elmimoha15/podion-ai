
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
  FileText
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";

const WorkspaceDetail = () => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock workspace data
  const workspace = {
    id: "1",
    name: "Tech Talk Show",
    description: "Weekly discussions about the latest in technology and innovation",
    episodes: 12,
    totalDuration: "8h 45m",
    createdAt: "2 months ago",
    tags: ["Technology", "Innovation", "Weekly"]
  };

  const episodes = [
    {
      id: "1",
      title: "The Future of AI in Business",
      description: "Exploring how artificial intelligence is transforming modern business operations",
      duration: "45:23",
      uploadedAt: "2 hours ago",
      status: "completed",
      contentGenerated: true,
      views: 1250
    },
    {
      id: "2", 
      title: "Blockchain Beyond Cryptocurrency",
      description: "Understanding the broader applications of blockchain technology",
      duration: "38:15",
      uploadedAt: "1 day ago", 
      status: "completed",
      contentGenerated: true,
      views: 980
    },
    {
      id: "3",
      title: "The Rise of Remote Work Culture",
      description: "How companies are adapting to permanent remote work models",
      duration: "52:41",
      uploadedAt: "3 days ago",
      status: "processing",
      contentGenerated: false,
      views: 0
    },
    {
      id: "4",
      title: "Cybersecurity in the Modern Age",
      description: "Essential security practices for businesses and individuals",
      duration: "41:18",
      uploadedAt: "1 week ago",
      status: "completed", 
      contentGenerated: true,
      views: 1850
    },
    {
      id: "5",
      title: "Green Technology and Sustainability",
      description: "Innovations driving environmental sustainability in tech",
      duration: "47:32",
      uploadedAt: "2 weeks ago",
      status: "completed",
      contentGenerated: true,
      views: 1420
    }
  ];

  const filteredEpisodes = episodes.filter(episode =>
    episode.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    episode.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = [
    { title: "Total Episodes", value: workspace.episodes, icon: Play },
    { title: "Total Duration", value: workspace.totalDuration, icon: Clock },
    { title: "Generated Content", value: `${episodes.filter(e => e.contentGenerated).length}/${episodes.length}`, icon: FileText },
    { title: "Avg Views", value: Math.round(episodes.reduce((sum, e) => sum + e.views, 0) / episodes.length).toLocaleString(), icon: TrendingUp }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <FolderOpen className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
            <p className="text-gray-600 mt-1 max-w-2xl">{workspace.description}</p>
            <div className="flex items-center gap-3 mt-3">
              <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>
              <span className="text-sm text-gray-500">Created {workspace.createdAt}</span>
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
          <div className="space-y-4">
            {filteredEpisodes.map((episode) => (
              <div key={episode.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {episode.title}
                    </h3>
                    <p className="text-sm text-gray-600 truncate">
                      {episode.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {episode.duration}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {episode.uploadedAt}
                      </span>
                      {episode.views > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {episode.views.toLocaleString()} views
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge 
                    variant={episode.status === 'completed' ? 'default' : 'secondary'}
                    className={episode.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {episode.status === 'completed' ? 'Completed' : 'Processing'}
                  </Badge>
                  
                  {episode.contentGenerated && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Content Ready
                    </Badge>
                  )}
                  
                  {episode.status === 'completed' && episode.contentGenerated && (
                    <Link to={`/episode/${episode.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Content
                      </Button>
                    </Link>
                  )}
                  
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
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
    </div>
  );
};

export default WorkspaceDetail;
