
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import { paddleApi } from "@/services/paddleApi";

// Pages
import LandingPage from "./pages/LandingPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Onboarding from "./pages/Onboarding";
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isOnboardingComplete } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }
  
  // If user is authenticated but hasn't completed onboarding, redirect to onboarding
  if (!isOnboardingComplete && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }
  
  return <>{children}</>;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isOnboardingComplete } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/signin" replace />;
  }
  
  // If user has already completed onboarding, redirect to dashboard
  if (isOnboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {

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
                <SignIn />
              </PublicRoute>
            } />
            <Route path="/signup" element={
              <PublicRoute>
                <SignUp />
              </PublicRoute>
            } />
            <Route path="/onboarding" element={
              <OnboardingRoute>
                <Onboarding />
              </OnboardingRoute>
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

const App = () => {
  useEffect(() => {
    // Initialize Paddle.js when app loads
    const initializePaddle = () => {
      if (typeof window !== 'undefined' && window.Paddle) {
        paddleApi.initializePaddle();
      } else {
        // Retry after a short delay if Paddle.js hasn't loaded yet
        setTimeout(initializePaddle, 100);
      }
    };
    
    initializePaddle();
  }, []);

  return (
    <AuthProvider>
      <WorkspaceProvider>
        <AppRoutes />
      </WorkspaceProvider>
    </AuthProvider>
  );
};

export default App;
