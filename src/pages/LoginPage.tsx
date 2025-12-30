import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Loader2 } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const emailSchema = z.string().trim().email({ message: "Please enter a valid email address" });
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" });

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email
    const emailValidation = emailSchema.safeParse(email);
    if (!emailValidation.success) {
      setError(emailValidation.error.errors[0].message);
      return;
    }

    // Validate password
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setError(passwordValidation.error.errors[0].message);
      return;
    }

    // For signup, check password confirmation
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        // Sign up new user
        const { error } = await supabase.auth.signUp({
          email: emailValidation.data,
          password: passwordValidation.data,
        });

        if (error) throw error;

        toast.success("Account created! You're now logged in.");
      } else {
        // Log in existing user
        const { error } = await supabase.auth.signInWithPassword({
          email: emailValidation.data,
          password: passwordValidation.data,
        });

        if (error) throw error;

        toast.success("Welcome back!");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message.includes("Invalid login credentials")) {
        setError("Invalid email or password");
      } else if (err.message.includes("Email not confirmed")) {
        setError("Please check your email to confirm your account");
      } else {
        setError(err.message || `Failed to ${mode === "login" ? "log in" : "sign up"}. Please try again.`);
      }
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

        {/* Login/Signup Toggle */}
        <div className="flex gap-2 mb-6 bg-muted p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              mode === "login"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 py-3 rounded-lg font-medium transition-all ${
              mode === "signup"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Login/Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
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
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 h-14 text-base rounded-xl bg-card border-border"
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* Confirm Password Field (only for signup) */}
          {mode === "signup" && (
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 h-14 text-base rounded-xl bg-card border-border"
                  disabled={loading}
                  required
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="xl"
            className="w-full"
            disabled={loading || !email || !password || (mode === "signup" && !confirmPassword)}
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {mode === "login" ? "Logging in..." : "Creating account..."}
              </>
            ) : (
              mode === "login" ? "Log In" : "Sign Up"
            )}
          </Button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-10">
          {mode === "signup"
            ? "Password must be at least 6 characters"
            : "Enter your email and password to continue"
          }
        </p>
      </div>
    </div>
  );
};
