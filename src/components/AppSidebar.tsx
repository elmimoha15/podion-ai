
import { useState } from "react";
import { 
  Home, 
  FolderOpen, 
  Settings, 
  CreditCard, 
  Upload,
  Mic,
  ChevronDown,
  Plus
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

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Upload Episode", url: "/upload", icon: Upload },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Billing", url: "/billing", icon: CreditCard },
];

const workspaces = [
  { id: "1", name: "Tech Talk Show", episodes: 12 },
  { id: "2", name: "Business Insights", episodes: 8 },
  { id: "3", name: "Creative Minds", episodes: 15 },
];

export function AppSidebar() {
  const { collapsed } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [workspacesOpen, setWorkspacesOpen] = useState(true);

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
      isActive 
        ? "bg-blue-50 text-blue-700 font-medium" 
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-r bg-white`}>
      <SidebarContent className="p-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Mic className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-xl text-gray-900">Podion AI</span>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            {mainItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink to={item.url} className={getNavCls}>
                    <item.icon className="h-5 w-5" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Workspaces */}
        {!collapsed && (
          <div className="mt-8">
            <Collapsible open={workspacesOpen} onOpenChange={setWorkspacesOpen}>
              <div className="flex items-center justify-between mb-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-gray-500 hover:text-gray-700">
                    <SidebarGroupLabel className="flex items-center gap-2">
                      <ChevronDown className={`h-4 w-4 transition-transform ${workspacesOpen ? 'rotate-0' : '-rotate-90'}`} />
                      Workspaces
                    </SidebarGroupLabel>
                  </Button>
                </CollapsibleTrigger>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                  onClick={() => console.log('Create new workspace')}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              
              <CollapsibleContent>
                <SidebarMenu className="space-y-1">
                  {workspaces.map((workspace) => (
                    <SidebarMenuItem key={workspace.id}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={`/workspace/${workspace.id}`} 
                          className={getNavCls}
                        >
                          <FolderOpen className="h-4 w-4" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {workspace.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {workspace.episodes} episodes
                            </div>
                          </div>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
