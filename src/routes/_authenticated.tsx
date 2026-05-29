import { createFileRoute, redirect, Outlet, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthShell,
});

function AuthShell() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/login" });
  };

  const navCls = "text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground transition-colors";
  const activeCls = "text-foreground";

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col">
      <header className="border-b border-border px-5 py-3 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-8">
          <Link to="/mapper" className="flex flex-col leading-tight">
            <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">CIaaS</span>
            <span className="text-xs tracking-tight">Architect</span>
          </Link>
          <nav className="flex gap-6">
            <Link to="/mapper" className={navCls} activeProps={{ className: `${navCls} ${activeCls}` }}>Mapper</Link>
            <Link to="/archive" className={navCls} activeProps={{ className: `${navCls} ${activeCls}` }}>Archive</Link>
            <Link to="/ledger" className={navCls} activeProps={{ className: `${navCls} ${activeCls}` }}>Ledger</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] text-muted-foreground hidden sm:inline">{email}</span>
          <button onClick={signOut} className="text-[10px] uppercase tracking-[0.18em] border border-border rounded px-3 py-1.5 hover:bg-accent">
            Sign out
          </button>
        </div>
      </header>
      <main className="flex-1"><Outlet /></main>
    </div>
  );
}
