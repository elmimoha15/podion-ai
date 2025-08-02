
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
  FolderOpen
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="min-h-screen blue-gradient-soft">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600 text-lg">
            Welcome back! Here's an overview of your podcast content performance.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Episodes</CardTitle>
              <Mic className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">24</div>
              <p className="text-xs text-emerald-600 font-medium">+2 this week</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Content Generated</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">96</div>
              <p className="text-xs text-emerald-600 font-medium">+8 this week</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Social Posts</CardTitle>
              <Share2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">156</div>
              <p className="text-xs text-emerald-600 font-medium">+12 this week</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Engagement Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">8.4%</div>
              <p className="text-xs text-emerald-600 font-medium">+1.2% this week</p>
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
              {[
                { title: "The Future of AI in Podcasting", workspace: "Tech Talk Show", status: "Published", date: "2 hours ago" },
                { title: "Building Better User Experiences", workspace: "Design Insights", status: "Processing", date: "1 day ago" },
                { title: "Marketing Strategies That Work", workspace: "Business Growth", status: "Published", date: "3 days ago" },
              ].map((episode, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white/60 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Play className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{episode.title}</h4>
                      <p className="text-sm text-gray-500">{episode.workspace} • {episode.date}</p>
                    </div>
                  </div>
                  <Badge variant={episode.status === "Published" ? "default" : "secondary"}>
                    {episode.status}
                  </Badge>
                </div>
              ))}
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
                  <span className="text-sm text-gray-500">24 published</span>
                </div>
                <Progress value={78} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">78% engagement rate</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Social Media Posts</span>
                  <span className="text-sm text-gray-500">156 shared</span>
                </div>
                <Progress value={92} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">92% engagement rate</p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Show Notes</span>
                  <span className="text-sm text-gray-500">24 episodes</span>
                </div>
                <Progress value={65} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">65% completion rate</p>
              </div>

              <Separator />

              <div className="flex items-center gap-4 pt-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">2.4K</div>
                  <div className="text-xs text-gray-500">Total Views</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">128</div>
                  <div className="text-xs text-gray-500">Shares</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">45</div>
                  <div className="text-xs text-gray-500">Comments</div>
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
