
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  FolderOpen, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Calendar,
  Play,
  TrendingUp,
  Clock,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Workspaces = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const workspaces = [
    {
      id: "1",
      name: "Tech Talk Show",
      description: "Weekly discussions about the latest in technology and innovation",
      episodes: 12,
      totalDuration: "8h 45m",
      lastUpdated: "2 hours ago",
      status: "active",
      tags: ["Technology", "Innovation", "Weekly"]
    },
    {
      id: "2",
      name: "Business Insights",
      description: "Deep dives into business strategy and entrepreneurship",
      episodes: 8,
      totalDuration: "5h 20m", 
      lastUpdated: "1 day ago",
      status: "active",
      tags: ["Business", "Strategy", "Entrepreneurship"]
    },
    {
      id: "3",
      name: "Creative Minds",
      description: "Conversations with artists, designers, and creative professionals",
      episodes: 15,
      totalDuration: "12h 15m",
      lastUpdated: "3 days ago",
      status: "active",
      tags: ["Art", "Design", "Creativity"]
    },
    {
      id: "4",
      name: "Health & Wellness",
      description: "Expert advice on fitness, nutrition, and mental health",
      episodes: 6,
      totalDuration: "4h 10m",
      lastUpdated: "1 week ago",
      status: "inactive",
      tags: ["Health", "Fitness", "Wellness"]
    }
  ];

  const filteredWorkspaces = workspaces.filter(workspace =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workspace.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-gray-600 mt-1">
            Organize your podcasts into dedicated workspaces
          </p>
        </div>
        
        <Button 
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          onClick={() => console.log("Create new workspace")}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Workspace
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search workspaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Workspaces
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{workspaces.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Episodes
            </CardTitle>
            <Play className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {workspaces.reduce((sum, w) => sum + w.episodes, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Workspaces
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {workspaces.filter(w => w.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Content Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">30h</div>
          </CardContent>
        </Card>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWorkspaces.map((workspace) => (
          <Card key={workspace.id} className="group hover:shadow-lg transition-all border-gray-100">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{workspace.name}</CardTitle>
                    <Badge 
                      variant={workspace.status === 'active' ? 'default' : 'secondary'}
                      className={workspace.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                    >
                      {workspace.status}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <CardDescription className="line-clamp-2">
                {workspace.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Episodes</span>
                    <div className="font-semibold text-gray-900">{workspace.episodes}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Duration</span>
                    <div className="font-semibold text-gray-900">{workspace.totalDuration}</div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {workspace.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {workspace.lastUpdated}
                  </div>
                  
                  <Link to={`/workspace/${workspace.id}`}>
                    <Button variant="outline" size="sm">
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredWorkspaces.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workspaces found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery ? "Try adjusting your search terms" : "Create your first workspace to get started"}
            </p>
            <Button onClick={() => console.log("Create new workspace")}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Workspaces;
