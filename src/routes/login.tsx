import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  beforeLoad: async ({ search }) => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: (search.redirect as any) || "/mapper" });
  },
  head: () => ({ meta: [{ title: "Sign in · Cognitive Time Architect" }] }),
  component: LoginPage,
});

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/mapper` },
        });
        if (error) throw error;
        toast.success("Account created. Check your email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: (search.redirect as any) || "/mapper" });
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/mapper" },
    });
    if (error) {
      toast.error("Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">← CIaaS</Link>
        <h1 className="mt-4 text-2xl font-light tracking-tight">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">Your maps and ledger are private to your account.</p>

        <form onSubmit={handleEmail} className="mt-8 space-y-3">
          <input
            type="email" required placeholder="email"
            value={email} onChange={e => setEmail(e.target.value)}
            className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-ring"
          />
          <input
            type="password" required minLength={6} placeholder="password"
            value={password} onChange={e => setPassword(e.target.value)}
            className="w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm outline-none focus:border-ring"
          />
          <button
            type="submit" disabled={busy}
            className="w-full rounded-md bg-primary text-primary-foreground py-2.5 text-[11px] uppercase tracking-[0.18em] disabled:opacity-50"
          >
            {busy ? "…" : mode === "signin" ? "Sign in →" : "Create →"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
          <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
        </div>

        <button
          onClick={handleGoogle} disabled={busy}
          className="w-full rounded-md border border-border py-2.5 text-[11px] uppercase tracking-[0.18em] hover:bg-accent disabled:opacity-50"
        >
          Continue with Google
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "No account? Create one" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
