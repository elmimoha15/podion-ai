
import { useState, useEffect } from "react";
import { 
  Home, 
  FolderOpen, 
  Settings, 
  CreditCard, 
  Upload,
  Mic,
  ChevronDown,
  Plus,
  Sparkles,
  Folder,
  Loader2
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CreateWorkspaceModal from "@/components/CreateWorkspaceModal";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { podcastApi } from "@/services/podcastApi";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Workspaces", url: "/workspaces", icon: Folder },
  { title: "Upload Episode", url: "/upload", icon: Upload, special: true },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Billing", url: "/billing", icon: CreditCard },
];

// Workspace colors for visual variety
const workspaceColors = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700", 
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
  "bg-indigo-100 text-indigo-700",
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [workspacesOpen, setWorkspacesOpen] = useState(true);
  const collapsed = state === "collapsed";
  const { workspaces, loading: workspacesLoading, refreshWorkspaces } = useWorkspace();
  const [podcastCounts, setPodcastCounts] = useState<Record<string, number>>({});

  const isActive = (path: string) => currentPath === path;

  // Fetch podcast counts for each workspace
  useEffect(() => {
    const fetchPodcastCounts = async () => {
      if (workspaces.length === 0) return;
      
      const counts: Record<string, number> = {};
      
      // Fetch podcast count for each workspace
      await Promise.all(
        workspaces.map(async (workspace) => {
          try {
            const episodes = await podcastApi.getWorkspaceEpisodes(workspace.id);
            counts[workspace.id] = episodes.length;
          } catch (error) {
            console.error(`Failed to fetch podcast count for workspace ${workspace.id}:`, error);
            counts[workspace.id] = 0;
          }
        })
      );
      
      setPodcastCounts(counts);
    };
    
    fetchPodcastCounts();
  }, [workspaces]);

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-r bg-white shadow-lg`}>
      <SidebarContent className="p-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3 animate-fade-in">
          <div className="h-10 w-10 rounded-xl blue-gradient-intense flex items-center justify-center shadow-lg hover-glow">
            <Mic className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-xl text-gray-900 tracking-tight">Podion AI</span>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu className="space-y-2">
            {mainItems.map((item, index) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to={item.url} 
                    className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 animate-fade-in-right ${
                      isActive(item.url)
                        ? item.special 
                          ? "blue-gradient-intense text-white shadow-lg" 
                          : "bg-blue-50 text-blue-700 border-l-4 border-blue-500 font-medium shadow-sm"
                        : item.special
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-md hover-lift"
                          : "text-gray-600 hover:text-gray-900 hover:bg-blue-50 hover-scale"
                    }`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <item.icon className={`h-5 w-5 transition-transform duration-300 ${
                      item.special ? "group-hover:rotate-12" : "group-hover:scale-110"
                    }`} />
                    {!collapsed && (
                      <span className="font-medium">
                        {item.title}
                        {item.special && <Sparkles className="inline h-4 w-4 ml-2 animate-pulse" />}
                      </span>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Workspaces */}
        {!collapsed && (
          <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Collapsible open={workspacesOpen} onOpenChange={setWorkspacesOpen}>
              <div className="flex items-center justify-between mb-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-gray-600 hover:text-gray-900 hover:bg-blue-50 transition-all duration-300 rounded-lg">
                    <SidebarGroupLabel className="flex items-center gap-2 px-2 py-1">
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${workspacesOpen ? 'rotate-0' : '-rotate-90'}`} />
                      <span className="font-semibold">Workspaces</span>
                    </SidebarGroupLabel>
                  </Button>
                </CollapsibleTrigger>
                <CreateWorkspaceModal
                  trigger={
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                  onWorkspaceCreated={refreshWorkspaces}
                />
              </div>
              
              <CollapsibleContent>
                <SidebarMenu className="space-y-2">
                  {workspacesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    </div>
                  ) : workspaces.length === 0 ? (
                    <div className="text-center py-4 text-sm text-gray-500">
                      No workspaces yet
                    </div>
                  ) : (
                    workspaces.map((workspace, index) => {
                      const colorClass = workspaceColors[index % workspaceColors.length];
                      const podcastCount = podcastCounts[workspace.id] ?? 0;
                      
                      return (
                        <SidebarMenuItem key={workspace.id}>
                          <SidebarMenuButton asChild>
                            <NavLink 
                              to={`/workspace/${workspace.id}`} 
                              className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover-lift animate-fade-in-right ${
                                isActive(`/workspace/${workspace.id}`)
                                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-500 font-medium shadow-sm"
                                  : "text-gray-600 hover:text-gray-900 hover:bg-blue-50"
                              }`}
                              style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                            >
                              <div className="relative">
                                <FolderOpen className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                                <div className={`absolute -top-1 -right-1 w-3 h-3 ${colorClass.split(' ')[0]} rounded-full animate-pulse`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate group-hover:text-blue-600 transition-colors duration-300">
                                  {workspace.name}
                                </div>
                                <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
                                  {podcastCount} podcast{podcastCount !== 1 ? 's' : ''}
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-md text-xs font-medium ${colorClass} transition-all duration-300 group-hover:scale-105`}>
                                {podcastCount}
                              </div>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })
                  )}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
