
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  FileText, 
  Clock, 
  TrendingUp, 
  Play, 
  MoreHorizontal,
  Zap,
  Calendar,
  Eye
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const stats = [
    { title: "Episodes Uploaded", value: "24", change: "+12%", icon: Upload },
    { title: "Words Generated", value: "156K", change: "+23%", icon: FileText },
    { title: "Time Saved", value: "48 hrs", change: "+15%", icon: Clock },
    { title: "SEO Score Avg", value: "94%", change: "+8%", icon: TrendingUp }
  ];

  const recentGenerations = [
    {
      id: "1",
      title: "The Future of AI in Business",
      workspace: "Tech Talk Show",
      createdAt: "2 hours ago",
      status: "completed",
      duration: "45:23",
      contentTypes: ["Blog Post", "Social Captions", "Show Notes"]
    },
    {
      id: "2", 
      title: "Building Sustainable Startups",
      workspace: "Business Insights",
      createdAt: "1 day ago",
      status: "completed",
      duration: "38:15",
      contentTypes: ["Blog Post", "Show Notes"]
    },
    {
      id: "3",
      title: "Creative Process Deep Dive",
      workspace: "Creative Minds",
      createdAt: "2 days ago", 
      status: "processing",
      duration: "52:41",
      contentTypes: ["Blog Post", "Social Captions"]
    }
  ];

  const quickActions = [
    {
      title: "Upload New Episode",
      description: "Start generating content from your latest podcast",
      icon: Upload,
      link: "/upload",
      color: "bg-blue-500"
    },
    {
      title: "Browse Workspaces", 
      description: "Manage your podcast projects and episodes",
      icon: FileText,
      link: "/workspaces",
      color: "bg-green-500"
    },
    {
      title: "View Analytics",
      description: "Track your content performance and growth",
      icon: TrendingUp,
      link: "#",
      color: "bg-purple-500"
    }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, John</h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your podcasts today
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            <Zap className="h-3 w-3 mr-1" />
            Professional Plan
          </Badge>
          <Link to="/upload">
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <Upload className="h-4 w-4 mr-2" />
              Upload Episode
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all cursor-pointer border-gray-100">
            <Link to={action.link}>
              <CardHeader>
                <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>

      {/* Recent Generations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Recent Generations</CardTitle>
              <CardDescription>Your latest podcast content generations</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentGenerations.map((generation) => (
              <div key={generation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {generation.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span>{generation.workspace}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {generation.createdAt}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {generation.duration}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      {generation.contentTypes.map((type, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge 
                    variant={generation.status === 'completed' ? 'default' : 'secondary'}
                    className={generation.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {generation.status === 'completed' ? 'Completed' : 'Processing'}
                  </Badge>
                  
                  {generation.status === 'completed' && (
                    <Link to={`/episode/${generation.id}`}>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
