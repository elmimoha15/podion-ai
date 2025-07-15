
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
  { title: "Upload Episode", url: "/upload", icon: Upload, featured: true },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Billing", url: "/billing", icon: CreditCard },
];

const workspaces = [
  { id: "1", name: "Tech Talk Show", episodes: 12 },
  { id: "2", name: "Business Insights", episodes: 8 },
  { id: "3", name: "Creative Minds", episodes: 15 },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const [workspacesOpen, setWorkspacesOpen] = useState(true);
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden group ${
      isActive 
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-lg" 
        : "text-gray-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:shadow-md"
    }`;

  const getFeaturedNavCls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative overflow-hidden group border-2 ${
      isActive 
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium shadow-xl border-blue-300" 
        : "text-blue-700 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200 hover:border-blue-300 hover:shadow-lg font-medium"
    }`;

  return (
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} border-r bg-gradient-to-b from-white to-blue-50/30`}>
      <SidebarContent className="p-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
            <Mic className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">Podion AI</span>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarMenu className="space-y-2">
            {mainItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to={item.url} 
                    className={item.featured ? getFeaturedNavCls : getNavCls}
                  >
                    <div className="relative">
                      <item.icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${item.featured ? 'drop-shadow-sm' : ''}`} />
                      {item.featured && !collapsed && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                      )}
                    </div>
                    {!collapsed && (
                      <span className="transition-all duration-300 group-hover:translate-x-1">
                        {item.title}
                      </span>
                    )}
                    {item.featured && !collapsed && (
                      <div className="ml-auto">
                        <div className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                          NEW
                        </div>
                      </div>
                    )}
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
              <div className="flex items-center justify-between mb-3">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto text-gray-500 hover:text-blue-700 transition-colors duration-300">
                    <SidebarGroupLabel className="flex items-center gap-2 font-semibold">
                      <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${workspacesOpen ? 'rotate-0' : '-rotate-90'}`} />
                      Workspaces
                    </SidebarGroupLabel>
                  </Button>
                </CollapsibleTrigger>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-300"
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
                          className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 text-gray-600 hover:text-blue-700 hover:bg-blue-50 group"
                        >
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                            <FolderOpen className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate group-hover:translate-x-1 transition-transform duration-300">
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
