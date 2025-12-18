import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGroups } from "@/hooks/useGroups";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Check, ArrowLeft, Loader2 } from "lucide-react";

type Step = "choice" | "create" | "success" | "join";

interface GroupOnboardingPageProps {
  onComplete: () => void;
}

export const GroupOnboardingPage = ({ onComplete }: GroupOnboardingPageProps) => {
  const [step, setStep] = useState<Step>("choice");
  const [groupName, setGroupName] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [joining, setJoining] = useState(false);
  const { createGroup, loading } = useGroups();
  const { user } = useAuth();

  const extractInviteCode = (input: string): string => {
    const trimmed = input.trim().toUpperCase();
    // Check if it's a full URL
    const urlMatch = trimmed.match(/\/JOIN\/([A-Z0-9]{8})/i);
    if (urlMatch) return urlMatch[1].toUpperCase();
    // Otherwise treat as raw code
    return trimmed;
  };

  const handleJoinGroup = async () => {
    if (!user) return;
    
    const code = extractInviteCode(inviteInput);
    if (code.length !== 8) {
      toast.error("Invalid invite code format");
      return;
    }

    setJoining(true);
    try {
      // Find the group
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id, name")
        .eq("invite_code", code)
        .maybeSingle();

      if (groupError || !group) {
        toast.error("Invalid invite link");
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
        return;
      }

      toast.success(`Joined "${group.name}"!`);
      onComplete();
    } catch (err) {
      console.error("Error joining group:", err);
      toast.error("Something went wrong");
    } finally {
      setJoining(false);
    }
  };

  const handleCreateGroup = async () => {
    if (groupName.trim().length < 2) {
      toast.error("Group name must be at least 2 characters");
      return;
    }

    try {
      const group = await createGroup(groupName.trim());
      const link = `${window.location.origin}/join/${group.invite_code}`;
      setInviteLink(link);
      setStep("success");
    } catch (error: any) {
      toast.error(error.message || "Failed to create group");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (step === "choice") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Get Started</h1>
          
          <div className="space-y-4">
            <Button
              onClick={() => setStep("create")}
              className="w-full bg-[#00A699] hover:bg-[#00A699]/90 text-white h-12"
            >
              Create a group
            </Button>
            
            <button
              onClick={() => setStep("join")}
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              I have an invite link
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "join") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => setStep("choice")}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Join a group</h1>
            <p className="text-muted-foreground text-sm">Paste an invite link or code</p>
          </div>
          
          <div className="space-y-4">
            <Input
              value={inviteInput}
              onChange={(e) => setInviteInput(e.target.value)}
              placeholder="Paste invite link or code"
              className="h-12"
            />
            
            <Button
              onClick={handleJoinGroup}
              disabled={joining || inviteInput.trim().length < 8}
              className="w-full bg-[#00A699] hover:bg-[#00A699]/90 text-white h-12"
            >
              {joining ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "create") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <button
            onClick={() => setStep("choice")}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Create a group</h1>
            <p className="text-muted-foreground text-sm">Give your group a name</p>
          </div>
          
          <div className="space-y-4">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="h-12"
              maxLength={50}
            />
            
            <Button
              onClick={handleCreateGroup}
              disabled={loading || groupName.trim().length < 2}
              className="w-full bg-[#00A699] hover:bg-[#00A699]/90 text-white h-12"
            >
              {loading ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Success step
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Group created!</h1>
          <p className="text-muted-foreground text-sm">
            Share this link to invite others
          </p>
        </div>
        
        <div className="bg-muted rounded-lg p-4 space-y-3">
          <p className="text-sm text-foreground break-all font-mono">{inviteLink}</p>
          
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="w-full h-10"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </>
            )}
          </Button>
        </div>
        
        <Button
          onClick={onComplete}
          className="w-full bg-[#00A699] hover:bg-[#00A699]/90 text-white h-12"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};
