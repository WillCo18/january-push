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
import { JourneyPage } from "./pages/JourneyPage";
import { SettingsPage } from "./pages/SettingsPage";
import { WelcomeScreen } from "./components/WelcomeScreen";
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
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeGroupName, setWelcomeGroupName] = useState("");

  const processPendingInvite = async (): Promise<{ joined: boolean; groupName?: string }> => {
    if (!user) return { joined: false };
    
    const pendingCode = getAndClearInviteCode();
    if (!pendingCode) return { joined: false };

    try {
      // Check if user already has a group
      const { data: existingMembership } = await supabase
        .from("group_memberships")
        .select("group_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingMembership) {
        toast.error("You're already in a group");
        return { joined: true };
      }

      // Find the group using secure RPC
      const { data: groups, error: groupError } = await supabase
        .rpc("lookup_group_by_invite", { p_invite_code: pendingCode.toUpperCase() });

      const group = groups?.[0];
      if (groupError || !group) {
        toast.error("Invalid invite link");
        return { joined: false };
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
        return { joined: false };
      }

      return { joined: true, groupName: group.name };
    } catch (err) {
      console.error("Error processing invite:", err);
      return { joined: false };
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
          // Check existing group membership first
          const { data: membership, error: memberError } = await supabase
            .from("group_memberships")
            .select("group_id")
            .eq("user_id", user.id)
            .maybeSingle();

          if (memberError) throw memberError;
          
          if (membership) {
            // User already has a group
            setHasGroup(true);
            // Clear any pending invite code since they're already in a group
            getAndClearInviteCode();
          } else {
            // No group - try to process any pending invite code
            const result = await processPendingInvite();
            if (result.joined && result.groupName) {
              setWelcomeGroupName(result.groupName);
              setShowWelcome(true);
            }
            setHasGroup(result.joined);
          }
        }
      } catch (err: any) {
        console.error("Error checking profile:", err);
        // If there's a foreign key or auth error, the session is stale - sign out
        if (err?.code === '23503' || err?.message?.includes('foreign key')) {
          console.log("Stale session detected, signing out");
          await supabase.auth.signOut();
          return;
        }
        setHasNickname(false);
        setHasGroup(false);
      } finally {
        setCheckingProfile(false);
      }
    };

    if (!authLoading) {
      checkProfile();
    }
  }, [user, authLoading, hasNickname]);

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

  if (showWelcome) {
    return (
      <WelcomeScreen 
        groupName={welcomeGroupName} 
        onContinue={() => setShowWelcome(false)} 
      />
    );
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
      <Route
        path="/journey/:userId"
        element={
          <ProtectedRoute>
            <JourneyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
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
