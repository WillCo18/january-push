import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SetNicknamePageProps {
  onComplete: () => void;
}

export const SetNicknamePage = ({ onComplete }: SetNicknamePageProps) => {
  const { user } = useAuth();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2) {
      setError("Nickname must be at least 2 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nickname: trimmedNickname })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success("Nickname saved!");
      onComplete();
    } catch (err: any) {
      console.error("Error saving nickname:", err);
      setError(err.message || "Failed to save nickname. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Welcome! What should we call you?
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter a nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="h-14 text-base rounded-xl bg-card border-border text-center"
              disabled={loading}
              maxLength={30}
            />
            {error && (
              <p className="text-sm text-destructive mt-2 text-center">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            size="xl"
            className="w-full"
            disabled={loading || nickname.trim().length < 2}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
