
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Folder, 
  Users, 
  Calendar,
  MoreVertical,
  Mic,
  FileText,
  TrendingUp,
  Settings
} from "lucide-react";
import { Link } from "react-router-dom";
import CreateWorkspaceModal from "@/components/CreateWorkspaceModal";

const Workspaces = () => {
  const workspaces = [
    {
      id: "1",
      name: "Tech Talk Show",
      description: "Weekly discussions about technology trends and innovations",
      episodes: 12,
      members: 3,
      lastActivity: "2 hours ago",
      color: "bg-blue-500",
      status: "Active"
    },
    {
      id: "2", 
      name: "Business Insights",
      description: "Entrepreneurship and business strategy conversations",
      episodes: 8,
      members: 2,
      lastActivity: "1 day ago",
      color: "bg-emerald-500",
      status: "Active"
    },
    {
      id: "3",
      name: "Creative Minds",
      description: "Interviews with artists, designers, and creative professionals",
      episodes: 15,
      members: 4,
      lastActivity: "3 days ago",
      color: "bg-purple-500",
      status: "Active"
    },
    {
      id: "4",
      name: "Health & Wellness",
      description: "Tips and advice for a healthier lifestyle",
      episodes: 6,
      members: 2,
      lastActivity: "1 week ago",
      color: "bg-orange-500",
      status: "Paused"
    }
  ];

  return (
    <div className="min-h-screen blue-gradient-soft">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Workspaces</h1>
            <p className="text-gray-600 text-lg">
              Organize your podcast content by topic or show
            </p>
          </div>
          <CreateWorkspaceModal
            trigger={
              <Button className="blue-gradient text-white shadow-lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Workspace
              </Button>
            }
            onWorkspaceCreated={() => console.log('Workspace created from main page')}
          />
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Folder className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">4</div>
                  <div className="text-sm text-gray-500">Total Workspaces</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-100">
                  <Mic className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">41</div>
                  <div className="text-sm text-gray-500">Total Episodes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">11</div>
                  <div className="text-sm text-gray-500">Team Members</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-orange-100">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">89%</div>
                  <div className="text-sm text-gray-500">Avg Engagement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="glass-effect border-0 shadow-xl group">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${workspace.color} flex items-center justify-center`}>
                      <Folder className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{workspace.name}</CardTitle>
                      <Badge 
                        variant={workspace.status === "Active" ? "default" : "secondary"}
                        className="mt-1"
                      >
                        {workspace.status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  {workspace.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Mic className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{workspace.episodes} episodes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-600">{workspace.members} members</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-gray-500">Last activity: {workspace.lastActivity}</span>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Link to={`/workspace/${workspace.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      View Content
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Create New Workspace Card */}
          <Card className="glass-effect border-0 shadow-xl border-dashed border-blue-300 group">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Workspace</h3>
              <p className="text-gray-600 text-sm mb-6">
                Start organizing your podcast content by creating a new workspace
              </p>
              <CreateWorkspaceModal
                trigger={
                  <Button className="blue-gradient text-white">
                    Get Started
                  </Button>
                }
                onWorkspaceCreated={() => console.log('Workspace created from create card')}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Workspaces;
