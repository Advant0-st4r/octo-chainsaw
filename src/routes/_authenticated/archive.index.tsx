import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listMaps } from "@/lib/architect.functions";

export const Route = createFileRoute("/_authenticated/archive/")({
  head: () => ({ meta: [{ title: "Archive · Cognitive Time Architect" }] }),
  component: ArchiveIndex,
});

function ArchiveIndex() {
  const fn = useServerFn(listMaps);
  const { data, isLoading } = useQuery({ queryKey: ["maps"], queryFn: () => fn() });

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Records</div>
      <h1 className="mt-1 text-2xl font-light tracking-tight">Archive</h1>
      <p className="mt-2 text-xs text-muted-foreground">Every map is recalled into future generations via retrieval.</p>

      <div className="mt-8 divide-y divide-border border border-border rounded-md overflow-hidden">
        {isLoading && <div className="p-6 text-xs text-muted-foreground">Loading…</div>}
        {!isLoading && data?.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No maps yet. <Link to="/mapper" className="text-foreground underline">Create your first →</Link>
          </div>
        )}
        {data?.map((m: any) => (
          <Link
            key={m.id}
            to="/archive/$id" params={{ id: m.id }}
            className="block px-5 py-4 hover:bg-accent transition-colors"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-sm truncate">{m.goals?.title ?? "Untitled"}</div>
                <div className="text-[11px] text-muted-foreground truncate mt-0.5">{m.summary}</div>
              </div>
              <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground shrink-0">
                <span className="text-cog-high">CDS {Math.round(m.cds_estimate ?? 0)}</span>
                <span className="text-cog-lever">LTF {Math.round(m.ltf_estimate ?? 0)}</span>
                <span>{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
