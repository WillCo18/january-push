import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import { LoginPage } from "./pages/LoginPage";
import { SetNicknamePage } from "./pages/SetNicknamePage";
import { GroupOnboardingPage } from "./pages/GroupOnboardingPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// Protected route wrapper with nickname and group check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasNickname, setHasNickname] = useState(false);
  const [hasGroup, setHasGroup] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (!user) {
        setCheckingProfile(false);
        return;
      }

      try {
        // Check nickname
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        setHasNickname(!!profile?.nickname);

        // Check group membership
        const { data: membership, error: memberError } = await supabase
          .from("group_memberships")
          .select("group_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberError) throw memberError;
        setHasGroup(!!membership);
      } catch (err) {
        console.error("Error checking profile:", err);
        setHasNickname(false);
        setHasGroup(false);
      } finally {
        setCheckingProfile(false);
      }
    };

    if (!authLoading) {
      checkProfile();
    }
  }, [user, authLoading]);

  if (authLoading || checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (!hasNickname) {
    return <SetNicknamePage onComplete={() => setHasNickname(true)} />;
  }

  if (!hasGroup) {
    return <GroupOnboardingPage onComplete={() => setHasGroup(true)} />;
  }

  return <>{children}</>;
};

// Main app content with auth protection
const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
