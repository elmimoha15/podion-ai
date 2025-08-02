import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useNavigate } from "react-router-dom";
import { workspaceApi, type Workspace } from "@/services/workspaceApi";
import { toast } from "sonner";

const Workspaces = () => {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Load workspaces on component mount
  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await workspaceApi.getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceCreated = (newWorkspace?: Workspace) => {
    if (newWorkspace) {
      setWorkspaces(prev => [newWorkspace, ...prev]);
    } else {
      // Fallback: reload all workspaces
      loadWorkspaces();
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      return;
    }

    try {
      await workspaceApi.deleteWorkspace(workspaceId);
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      toast.success('Workspace deleted successfully');
    } catch (err) {
      console.error('Failed to delete workspace:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete workspace');
    }
  };

  // Filter and sort workspaces
  const filteredWorkspaces = workspaces
    .filter(workspace => {
      const matchesSearch = workspace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          workspace.description.toLowerCase().includes(searchTerm.toLowerCase());
      // Note: We removed category filtering since category field was removed
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        case "episodes":
          return (b.metadata?.podcast_count || 0) - (a.metadata?.podcast_count || 0);
        default:
          return 0;
      }
    });

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
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Button>
            }
            onWorkspaceCreated={handleWorkspaceCreated}
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
                  <div className="text-2xl font-bold text-gray-900">{workspaces.length}</div>
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
                  <div className="text-2xl font-bold text-gray-900">{workspaces.reduce((acc, workspace) => acc + (workspace.metadata?.podcast_count || 0), 0)}</div>
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
                  <div className="text-2xl font-bold text-gray-900">-</div>
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-slate-600">Loading workspaces...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">{error}</div>
            <Button onClick={loadWorkspaces} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && workspaces.length === 0 && (
          <div className="text-center py-12">
            <Folder className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No workspaces yet</h3>
            <p className="text-slate-500 mb-6">Create your first workspace to get started with organizing your podcasts.</p>
            <CreateWorkspaceModal 
              trigger={
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Workspace
                </Button>
              }
              onWorkspaceCreated={handleWorkspaceCreated}
            />
          </div>
        )}

        {/* Workspaces Grid */}
        {!loading && !error && filteredWorkspaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkspaces.map((workspace) => (
              <Card key={workspace.id} className="glass-effect border-0 shadow-xl group hover:shadow-2xl transition-all duration-200 cursor-pointer"
                    onClick={() => navigate(`/workspace/${workspace.id}`)}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
                        <Folder className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{workspace.name}</CardTitle>
                        <Badge 
                          variant="default"
                          className="mt-1 bg-green-100 text-green-700"
                        >
                          Active
                        </Badge>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {workspace.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Mic className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{workspace.metadata?.podcast_count || 0} podcasts</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-gray-500">Created: {new Date(workspace.created_at).toLocaleDateString()}</span>
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
                  onWorkspaceCreated={handleWorkspaceCreated}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && workspaces.length > 0 && filteredWorkspaces.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No workspaces found</h3>
            <p className="text-slate-500">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Workspaces;
