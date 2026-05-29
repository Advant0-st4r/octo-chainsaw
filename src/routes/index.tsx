import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cognitive Time Architect — leverage-ordered execution maps" },
      { name: "description", content: "Convert any goal into the smallest shippable execution architecture, ordered by leverage and hardened against interruption." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-mono">
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">CIaaS · Cognitive Time</div>
          <div className="text-base tracking-tight">Execution Architect</div>
        </div>
        <Link to="/login" className="text-[10px] uppercase tracking-[0.18em] rounded-md border border-border px-4 py-2 hover:bg-accent">
          Sign in →
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pt-24 pb-32">
        <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-6">v1 · single operator</div>
        <h1 className="text-5xl md:text-6xl font-light tracking-tight leading-[1.05]">
          Turn any goal into a <span className="text-cog-lever">leverage-ordered</span> execution map.
        </h1>
        <p className="mt-8 text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl">
          The Architect decomposes objectives into cognitive-time-typed phases — sequenced for maximum
          compounding, annotated with density risk, and hardened with a named re-ramp protocol.
          Every map is private, persisted, and recalled by retrieval the next time you build.
        </p>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-[10px] uppercase tracking-[0.18em]">
          <div className="border border-border rounded-md p-4">
            <div className="text-cog-high text-base mb-2">◆</div>
            <div className="text-muted-foreground">High-density</div>
            <div className="text-foreground/80 mt-1 normal-case tracking-normal text-xs">Novel, non-automatable</div>
          </div>
          <div className="border border-border rounded-md p-4">
            <div className="text-cog-lever text-base mb-2">◈</div>
            <div className="text-muted-foreground">Leveraged</div>
            <div className="text-foreground/80 mt-1 normal-case tracking-normal text-xs">Unlocks downstream</div>
          </div>
          <div className="border border-border rounded-md p-4">
            <div className="text-cog-low text-base mb-2">◇</div>
            <div className="text-muted-foreground">Low-density</div>
            <div className="text-foreground/80 mt-1 normal-case tracking-normal text-xs">Compress, batch</div>
          </div>
          <div className="border border-border rounded-md p-4">
            <div className="text-cog-latent text-base mb-2">◌</div>
            <div className="text-muted-foreground">Latent</div>
            <div className="text-foreground/80 mt-1 normal-case tracking-normal text-xs">Eliminate or buffer</div>
          </div>
        </div>

        <div className="mt-14 flex gap-3">
          <Link to="/login" className="rounded-md bg-primary text-primary-foreground px-5 py-3 text-[11px] uppercase tracking-[0.18em]">
            Enter workspace ◈
          </Link>
          <a href="#how" className="rounded-md border border-border px-5 py-3 text-[11px] uppercase tracking-[0.18em] hover:bg-accent">
            How it works
          </a>
        </div>

        <section id="how" className="mt-32 border-t border-border pt-10">
          <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">Loop</div>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li><span className="text-foreground">01</span> · Compile goal into leanest executable architecture.</li>
            <li><span className="text-foreground">02</span> · Reality-filter against your stated constraints.</li>
            <li><span className="text-foreground">03</span> · Compress to minimally shippable scope.</li>
            <li><span className="text-foreground">04</span> · Return the fastest implementation sequence for the first working loop.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
