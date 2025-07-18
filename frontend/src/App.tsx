
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useState } from "react";

// Pages
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Workspaces from "./pages/Workspaces";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import Upload from "./pages/Upload";
import EpisodeDetail from "./pages/EpisodeDetail";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";

// Layout
import AppLayout from "./components/AppLayout";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    return isAuthenticated ? children : <Navigate to="/signin" replace />;
  };

  const PublicRoute = ({ children }: { children: React.ReactNode }) => {
    return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={
              <PublicRoute>
                <SignIn onSignIn={() => setIsAuthenticated(true)} />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <SignUp onSignUp={() => setIsAuthenticated(true)} />
              </PublicRoute>
            } />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/workspaces" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <AppLayout>
                    <Workspaces />
                  </AppLayout>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/workspace/:id" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <AppLayout>
                    <WorkspaceDetail />
                  </AppLayout>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/upload" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <AppLayout>
                    <Upload />
                  </AppLayout>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/episode/:id" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <AppLayout>
                    <EpisodeDetail />
                  </AppLayout>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            <Route path="/billing" element={
              <ProtectedRoute>
                <SidebarProvider>
                  <AppLayout>
                    <Billing />
                  </AppLayout>
                </SidebarProvider>
              </ProtectedRoute>
            } />

            {/* Catch All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
