import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getMap } from "@/lib/architect.functions";
import { COG_META, type CogType } from "@/lib/cog-types";

export const Route = createFileRoute("/_authenticated/archive/$id")({
  head: () => ({ meta: [{ title: "Map · Cognitive Time Architect" }] }),
  component: MapDetail,
});

function MapDetail() {
  const { id } = Route.useParams();
  const fn = useServerFn(getMap);
  const { data, isLoading, error } = useQuery({
    queryKey: ["map", id],
    queryFn: () => fn({ data: { id } }),
  });
  const [view, setView] = useState<"map" | "principles" | "risks">("map");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (isLoading) return <div className="p-8 text-xs text-muted-foreground font-mono">Loading…</div>;
  if (error) return <div className="p-8 text-xs text-cog-danger font-mono">{(error as Error).message}</div>;
  if (!data) return null;

  const { map, phases, principles, risks } = data as any;
  const totalMin = phases.reduce((s: number, p: any) => s + (p.duration_minutes ?? 60), 0) || 1;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/archive" className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground">← Archive</Link>

      <div className="mt-4 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">{map.goals?.title}</div>
      <h1 className="mt-1 text-2xl font-light tracking-tight">{map.summary}</h1>

      <div className="mt-6 rounded-md bg-accent/30 border border-border p-4">
        <div className="text-[9px] uppercase tracking-[0.18em] text-primary mb-1">Leverage thesis</div>
        <div className="text-sm text-foreground/90 leading-relaxed">{map.leverage_rationale}</div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Metric label="CDS estimate" value={Math.round(map.cds_estimate ?? 0)} unit="%" cls="text-cog-high" />
        <Metric label="Leveraged" value={Math.round(map.ltf_estimate ?? 0)} unit="%" cls="text-cog-lever" />
        <Metric label="Phases" value={phases.length} unit="" cls="text-primary" />
      </div>

      {/* Timeline bar */}
      <div className="mt-6 flex h-2.5 rounded overflow-hidden gap-[2px]">
        {phases.map((p: any) => {
          const w = ((p.duration_minutes ?? 60) / totalMin) * 100;
          const meta = COG_META[p.session_type as CogType];
          return <div key={p.id} title={`${p.name} · ${p.duration_minutes ?? 60}m`}
            className={`${meta.bgCls.replace("/10", "")} opacity-90`} style={{ width: `${w}%` }} />;
        })}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-6 border-b border-border">
        {(["map","principles","risks"] as const).map(t => (
          <button key={t} onClick={() => setView(t)}
            className={`pb-2 text-[10px] uppercase tracking-[0.18em] -mb-px border-b ${view === t ? "text-foreground border-primary" : "text-muted-foreground border-transparent"}`}>
            {t === "map" ? "Execution map" : t === "principles" ? "Principles" : "Risk & recovery"}
          </button>
        ))}
      </div>

      {view === "map" && (
        <div className="mt-6 space-y-2">
          {phases.map((p: any) => {
            const meta = COG_META[p.session_type as CogType];
            const exp = !!expanded[p.id];
            const lev = Number(p.leverage_multiplier ?? 0);
            return (
              <div key={p.id}
                onClick={() => setExpanded(e => ({ ...e, [p.id]: !e[p.id] }))}
                className="cursor-pointer rounded-md bg-card border border-border hover:border-ring/50 transition-colors p-4"
                style={{ borderLeftWidth: 3, borderLeftColor: `var(--cog-${p.session_type})` }}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground w-6">P{p.ord + 1}</span>
                  <span className={`text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 rounded ${meta.bgCls} ${meta.cls}`}>
                    {meta.glyph} {meta.label}
                  </span>
                  <span className="text-sm flex-1">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground">{p.duration_minutes ?? "?"}m</span>
                  <span className={`text-[10px] ${lev >= 3 ? "text-cog-lever" : lev >= 2 ? "text-cog-high" : "text-muted-foreground"}`}>×{lev.toFixed(1)}</span>
                  <span className="text-muted-foreground text-[10px]">{exp ? "▲" : "▼"}</span>
                </div>
                {exp && (
                  <div className="mt-4 pl-9 space-y-3">
                    <div className="text-xs text-muted-foreground leading-relaxed">{p.description}</div>
                    <div className="grid grid-cols-2 gap-4">
                      <Block label="Actions" items={p.actions} accent="text-primary" mark="→" />
                      <Block label="Unlocks downstream" items={p.unlocks} accent="text-cog-lever" mark="◈" />
                    </div>
                    <Callout label="Compounding mechanism" body={p.compounding_mechanism} color="cog-high" />
                    {p.cognitive_waste_risk && (
                      <Callout label="Density risk" body={p.cognitive_waste_risk} color="cog-danger" />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === "principles" && (
        <div className="mt-6 space-y-3">
          {principles.map((p: any) => (
            <div key={p.id} className="rounded-md border border-border bg-card p-4 text-sm">
              <span className="text-muted-foreground mr-3">{String(p.ord + 1).padStart(2, "0")}</span>
              {p.text}
            </div>
          ))}
          {map.scalability_mechanism && (
            <div className="mt-6 rounded-md border border-border bg-card p-4">
              <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Scalability mechanism</div>
              <div className="text-sm">{map.scalability_mechanism}</div>
            </div>
          )}
        </div>
      )}

      {view === "risks" && (
        <div className="mt-6 space-y-3">
          {risks.map((r: any) => (
            <div key={r.id} className="rounded-md border border-cog-danger/30 bg-cog-danger/5 p-4 text-sm">
              <span className="text-cog-danger mr-3">⚠</span>{r.text}
            </div>
          ))}
          {map.re_ramp_protocol && (
            <div className="mt-6 rounded-md border border-border bg-card p-4">
              <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">Re-ramp protocol</div>
              <div className="text-sm leading-relaxed">{map.re_ramp_protocol}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, unit, cls }: { label: string; value: number; unit: string; cls: string }) {
  return (
    <div className="bg-card border border-border rounded-md p-3 text-center">
      <div className={`text-2xl ${cls}`}>{value}<span className="text-xs text-muted-foreground">{unit}</span></div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Block({ label, items, accent, mark }: { label: string; items: any[]; accent: string; mark: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{label}</div>
      <ul className="space-y-1.5 text-xs">
        {(items ?? []).map((it: string, i: number) => (
          <li key={i} className="flex gap-2 leading-relaxed">
            <span className={accent}>{mark}</span><span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Callout({ label, body, color }: { label: string; body: string; color: string }) {
  return (
    <div className={`rounded-md p-3 border-l-2 bg-${color}/10`} style={{ borderLeftColor: `var(--${color})` }}>
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1">{label}</div>
      <div className="text-xs leading-relaxed">{body}</div>
    </div>
  );
}
