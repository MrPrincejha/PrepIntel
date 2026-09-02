"use client";

import { Logo } from "@/components/core/Logo";
import { GlassPanel } from "@/components/core/GlassPanel";
import { GradientButton } from "@/components/core/GradientButton";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError(false);

    let authError = null;

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      authError = signInError;
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      authError = signUpError;
    }

    if (authError) {
      setMessage(authError.message);
      setError(true);
    } else {
      if (mode === "signup") {
        setMessage("Success! Check your email to confirm your account.");
      } else {
        setMessage("Logged in successfully. Redirecting...");
        window.location.href = "/dashboard";
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px] pointer-events-none opacity-50" />
      
      <GlassPanel className="w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" className="mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {mode === "login" ? "Welcome Back" : "Create an Account"}
          </h1>
          <p className="text-sm text-white/50 text-center">
            {mode === "login" 
              ? "Sign in to access your personalized placement intelligence."
              : "Sign up to track verified OA trends and get a roadmap."}
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-full py-3 hover:bg-white/90 transition-colors mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs font-medium text-white/40 uppercase">Or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/30"
            />
          </div>
          <div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 characters)"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/30"
            />
          </div>
          <GradientButton type="submit" className="w-full" disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Sign Up"}
          </GradientButton>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setMessage("");
              setError(false);
            }}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {mode === "login" 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </button>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg border text-sm text-center ${
            error 
              ? "bg-red-500/10 border-red-500/20 text-red-400" 
              : "bg-status-success/10 border-status-success/20 text-status-success"
          }`}>
            {message}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
