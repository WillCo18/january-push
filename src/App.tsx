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
import { JoinGroupPage, getAndClearInviteCode } from "./pages/JoinGroupPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const queryClient = new QueryClient();

// Protected route wrapper with nickname and group check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasNickname, setHasNickname] = useState(false);
  const [hasGroup, setHasGroup] = useState(false);

  const processPendingInvite = async () => {
    if (!user) return false;
    
    const pendingCode = getAndClearInviteCode();
    if (!pendingCode) return false;

    try {
      // Check if user already has a group
      const { data: existingMembership } = await supabase
        .from("group_memberships")
        .select("group_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMembership) {
        toast.error("You're already in a group");
        return true;
      }

      // Find the group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id, name")
        .eq("invite_code", pendingCode.toUpperCase())
        .maybeSingle();

      if (groupError || !group) {
        toast.error("Invalid invite link");
        return false;
      }

      // Join the group
      const { error: joinError } = await supabase
        .from("group_memberships")
        .insert({
          user_id: user.id,
          group_id: group.id,
        });

      if (joinError) {
        if (joinError.code === "23505") {
          toast.error("You're already in a group");
        } else {
          toast.error("Failed to join group");
        }
        return false;
      }

      toast.success(`Joined "${group.name}"!`);
      return true;
    } catch (err) {
      console.error("Error processing invite:", err);
      return false;
    }
  };

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
        const nicknameExists = !!profile?.nickname;
        setHasNickname(nicknameExists);

        // Only process invites and check group if nickname exists
        if (nicknameExists) {
          // Try to process any pending invite code
          const joinedViaInvite = await processPendingInvite();
          
          if (joinedViaInvite) {
            setHasGroup(true);
          } else {
            // Check existing group membership
            const { data: membership, error: memberError } = await supabase
              .from("group_memberships")
              .select("group_id")
              .eq("user_id", user.id)
              .maybeSingle();

            if (memberError) throw memberError;
            setHasGroup(!!membership);
          }
        }
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
      <Route path="/join/:code" element={<JoinGroupPage />} />
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
