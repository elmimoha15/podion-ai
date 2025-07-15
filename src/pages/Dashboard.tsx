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
    <div className="gradient-bg min-h-screen">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, John</h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your podcasts today
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200 hover:scale-105 transition-transform duration-300">
              <Zap className="h-3 w-3 mr-1" />
              Professional Plan
            </Badge>
            <Link to="/upload">
              <Button className="blue-gradient text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300">
                <Upload className="h-4 w-4 mr-2" />
                Upload Episode
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 card-gradient animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                  <stat.icon className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-green-600 flex items-center mt-1 group-hover:scale-105 transition-transform duration-300">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          {quickActions.map((action, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-500 cursor-pointer border-gray-100 transform hover:-translate-y-2 card-gradient">
              <Link to={action.link}>
                <CardHeader>
                  <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors duration-300">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          ))}
        </div>

        {/* Recent Generations */}
        <Card className="card-gradient shadow-lg animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Recent Generations</CardTitle>
                <CardDescription>Your latest podcast content generations</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="hover:bg-blue-50 transition-colors duration-300">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentGenerations.map((generation, index) => (
                <div key={generation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-[1.02] group">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg blue-gradient flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Play className="h-5 w-5 text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors duration-300">
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
                      className={`transition-all duration-300 ${generation.status === 'completed' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'}`}
                    >
                      {generation.status === 'completed' ? 'Completed' : 'Processing'}
                    </Badge>
                    
                    {generation.status === 'completed' && (
                      <Link to={`/episode/${generation.id}`}>
                        <Button variant="outline" size="sm" className="hover:bg-blue-50 transition-colors duration-300">
                          <Eye className="h-4 w-4 mr-2" />
                          View Content
                        </Button>
                      </Link>
                    )}
                    
                    <Button variant="ghost" size="sm" className="hover:bg-blue-50 transition-colors duration-300">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
