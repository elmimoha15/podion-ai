
import { AppSidebar } from "./AppSidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      <AppSidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-gray-600 hover:text-gray-900" />
            <div className="h-6 w-px bg-gray-200" />
            <h1 className="text-lg font-semibold text-gray-900">Podion AI</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Bell className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">John Doe</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
