import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const INVITE_CODE_KEY = "pending_invite_code";

export const saveInviteCode = (code: string) => {
  // Use sessionStorage instead of localStorage for better security
  // sessionStorage is cleared when the tab is closed, reducing XSS risk
  sessionStorage.setItem(INVITE_CODE_KEY, code);
};

export const getAndClearInviteCode = () => {
  const code = sessionStorage.getItem(INVITE_CODE_KEY);
  sessionStorage.removeItem(INVITE_CODE_KEY);
  return code;
};

export const JoinGroupPage = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const handleJoin = async () => {
      if (authLoading) return;

      // If not logged in, save code and redirect to login
      if (!user) {
        if (code) {
          saveInviteCode(code);
        }
        navigate("/", { replace: true });
        return;
      }

      // User is logged in, process the join
      if (!code) {
        toast.error("Invalid invite link");
        navigate("/", { replace: true });
        return;
      }

      try {
        // Check if user already has a group
        const { data: existingMembership } = await supabase
          .from("group_memberships")
          .select("group_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existingMembership) {
          toast.error("You're already in a group");
          navigate("/", { replace: true });
          return;
        }

        // Find the group by invite code
        const { data: group, error: groupError } = await supabase
          .from("groups")
          .select("id, name")
          .eq("invite_code", code.toUpperCase())
          .maybeSingle();

        if (groupError || !group) {
          toast.error("Invalid invite link");
          navigate("/", { replace: true });
          return;
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
          navigate("/", { replace: true });
          return;
        }

        toast.success(`Joined "${group.name}"!`);
        navigate("/", { replace: true });
      } catch (err) {
        console.error("Error joining group:", err);
        toast.error("Something went wrong");
        navigate("/", { replace: true });
      }
    };

    handleJoin();
  }, [code, user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Joining group...</p>
      </div>
    </div>
  );
};
