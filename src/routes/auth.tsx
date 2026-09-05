import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/use-auth";
import logo from "@/assets/logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Account — ALTAIRSTORE" },
      { name: "description", content: "Sign in to the ALTAIRSTORE account and admin console." },
      { property: "og:title", content: "Account — ALTAIRSTORE" },
      { property: "og:description", content: "Sign in to the ALTAIRSTORE account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session, isAdmin, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) {
      void navigate({ to: isAdmin ? "/admin" : "/" });
    }
  }, [loading, session, isAdmin, navigate]);

  const field =
    "mt-1 w-full rounded-lg border border-mercury bg-background px-3 py-2.5 text-sm outline-none focus:border-obsidian";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign you in");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Google sign-in failed");
      return;
    }
  };

  return (
    <div className="min-h-screen bg-background text-obsidian">
      <SiteHeader />

      <div className="mx-auto max-w-sm px-6 py-14">
        <img src={logo.url} alt="ALTAIRSTORE" className="mx-auto h-16 w-16 object-contain" />
        <h1 className="mt-6 text-center font-display text-2xl uppercase tracking-tight">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <label className="block">
            <span className="eyebrow text-muted-foreground">Email</span>
            <input
              required
              type="email"
              className={field}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="eyebrow text-muted-foreground">Password</span>
            <input
              required
              type="password"
              minLength={6}
              className={field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-obsidian py-3.5 text-[10px] font-bold uppercase tracking-[0.28em] text-white disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={google}
          className="mt-3 w-full rounded-full border border-mercury py-3.5 text-[10px] font-bold uppercase tracking-[0.28em]"
        >
          Continue with Google
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          {mode === "signin" ? "Need an account? Register" : "Already registered? Sign in"}
        </button>
      </div>
    </div>
  );
}
