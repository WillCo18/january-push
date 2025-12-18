import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: validation.data,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        throw error;
      }

      setSent(true);
      toast.success("Magic link sent!");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Failed to send magic link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            January 100 Challenge
          </h1>
          <p className="text-muted-foreground text-lg">
            100 press-ups. Every day. All January.
          </p>
        </div>

        {/* Login Form */}
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl bg-card border-border"
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </div>

            <Button
              type="submit"
              size="xl"
              className="w-full"
              disabled={loading || !email}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                "Send magic link"
              )}
            </Button>
          </form>
        ) : (
          <div className="text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Check your email
            </h2>
            <p className="text-muted-foreground mb-6">
              We've sent a magic link to<br />
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <Button
              variant="ghost"
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="text-muted-foreground"
            >
              Use a different email
            </Button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          No password needed. We'll email you a secure link to sign in.
        </p>
      </div>
    </div>
  );
};
