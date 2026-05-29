import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { appendSessionEvent, listSessionEvents } from "@/lib/ledger.functions";
import { COG_META, type CogType } from "@/lib/cog-types";

export const Route = createFileRoute("/_authenticated/ledger")({
  head: () => ({ meta: [{ title: "Ledger · Cognitive Time Architect" }] }),
  component: LedgerPage,
});

function LedgerPage() {
  const list = useServerFn(listSessionEvents);
  const append = useServerFn(appendSessionEvent);
  const qc = useQueryClient();
  const [days, setDays] = useState(7);
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["events", days],
    queryFn: () => list({ data: { days } }),
  });

  const mut = useMutation({
    mutationFn: append,
    onSuccess: () => {
      toast.success("Event logged.");
      qc.invalidateQueries({ queryKey: ["events"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Append-only</div>
          <h1 className="mt-1 text-2xl font-light tracking-tight">Cognitive ledger</h1>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`text-[10px] uppercase tracking-[0.15em] px-3 py-1.5 rounded border ${days === d ? "border-primary text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
              {d}d
            </button>
          ))}
          <button onClick={() => setOpen(true)}
            className="text-[10px] uppercase tracking-[0.15em] bg-primary text-primary-foreground px-3 py-1.5 rounded">
            + Log session
          </button>
        </div>
      </div>

      {isLoading ? <div className="mt-8 text-xs text-muted-foreground">Loading…</div> : (
        <>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Metric label="CDS" value={data!.metrics.CDS} unit="%" cls="text-cog-high" />
            <Metric label="Latent ratio" value={data!.metrics.LTR} unit="%" cls="text-cog-latent" />
            <Metric label="Leveraged" value={data!.metrics.LTF} unit="%" cls="text-cog-lever" />
            <Metric label="Re-ramp cost" value={data!.metrics.RCI} unit="min" cls="text-primary" />
          </div>

          <div className="mt-3 text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
            {data!.metrics.sessions} sessions · {data!.metrics.total_minutes} min
          </div>

          <div className="mt-6 border border-border rounded-md overflow-hidden">
            {data!.events.length === 0 && <div className="p-8 text-center text-xs text-muted-foreground">No events in this window.</div>}
            <div className="divide-y divide-border">
              {data!.events.map((e: any) => {
                const meta = COG_META[e.time_type as CogType];
                return (
                  <div key={e.id} className="px-4 py-3 flex items-center gap-4 text-xs">
                    <span className={`${meta.cls} text-base`}>{meta.glyph}</span>
                    <span className="text-muted-foreground w-32 shrink-0">{new Date(e.start_ts).toLocaleString()}</span>
                    <span className="w-16 shrink-0">{Math.round(e.duration_s / 60)}m</span>
                    <span className="flex-1 truncate">{e.session_label || meta.label}</span>
                    {e.blocked_flag && <span className="text-cog-latent text-[10px]">BLOCKED</span>}
                    {e.leveraged_flag && <span className="text-cog-lever text-[10px]">LEVERED</span>}
                    {e.density_score != null && <span className="text-muted-foreground">{e.density_score}%</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {open && <LogModal onClose={() => setOpen(false)} onSubmit={(v) => mut.mutate({ data: v })} busy={mut.isPending} />}
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

function LogModal({ onClose, onSubmit, busy }: { onClose: () => void; onSubmit: (v: any) => void; busy: boolean }) {
  const now = new Date();
  const ago = new Date(now.getTime() - 60 * 60_000);
  const fmt = (d: Date) => d.toISOString().slice(0, 16);
  const [v, setV] = useState({
    session_label: "",
    start_ts: fmt(ago),
    end_ts: fmt(now),
    time_type: "high" as CogType,
    density_score: 70,
    blocked_flag: false,
    leveraged_flag: false,
    context_switch_count: 0,
    re_ramp_minutes: 0,
    notes: "",
  });
  const inp = "w-full bg-input border border-border rounded-md px-3 py-2 text-sm outline-none focus:border-ring";

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur flex items-center justify-center px-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="bg-card border border-border rounded-lg p-6 w-full max-w-md">
        <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Log session</div>
        <h3 className="mt-1 text-lg font-light">Append cognitive event</h3>

        <div className="mt-5 space-y-3">
          <input className={inp} placeholder="Label (optional)" value={v.session_label} onChange={e => setV({ ...v, session_label: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start</Label><input type="datetime-local" className={inp} value={v.start_ts} onChange={e => setV({ ...v, start_ts: e.target.value })} /></div>
            <div><Label>End</Label><input type="datetime-local" className={inp} value={v.end_ts} onChange={e => setV({ ...v, end_ts: e.target.value })} /></div>
          </div>
          <div>
            <Label>Time type</Label>
            <div className="flex gap-2">
              {(Object.keys(COG_META) as CogType[]).map(k => (
                <button key={k} onClick={() => setV({ ...v, time_type: k })}
                  className={`flex-1 text-[10px] uppercase tracking-[0.15em] py-2 rounded border ${v.time_type === k ? `${COG_META[k].cls} border-current` : "border-border text-muted-foreground"}`}>
                  {COG_META[k].glyph} {k}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Density {v.density_score}%</Label>
            <input type="range" min={0} max={100} value={v.density_score} onChange={e => setV({ ...v, density_score: Number(e.target.value) })} className="w-full accent-primary" />
          </div>
          <div className="flex gap-4 text-xs">
            <label className="flex items-center gap-2"><input type="checkbox" checked={v.blocked_flag} onChange={e => setV({ ...v, blocked_flag: e.target.checked })} />blocked</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={v.leveraged_flag} onChange={e => setV({ ...v, leveraged_flag: e.target.checked })} />leveraged</label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Context switches</Label><input type="number" min={0} className={inp} value={v.context_switch_count} onChange={e => setV({ ...v, context_switch_count: Number(e.target.value) })} /></div>
            <div><Label>Re-ramp (min)</Label><input type="number" min={0} className={inp} value={v.re_ramp_minutes} onChange={e => setV({ ...v, re_ramp_minutes: Number(e.target.value) })} /></div>
          </div>
          <textarea className={inp + " resize-y"} rows={2} placeholder="Notes" value={v.notes} onChange={e => setV({ ...v, notes: e.target.value })} />
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <button onClick={onClose} className="text-[10px] uppercase tracking-[0.15em] border border-border px-4 py-2 rounded">Cancel</button>
          <button disabled={busy} onClick={() => onSubmit({
            ...v,
            start_ts: new Date(v.start_ts).toISOString(),
            end_ts: new Date(v.end_ts).toISOString(),
          })} className="text-[10px] uppercase tracking-[0.15em] bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-50">
            {busy ? "…" : "Append →"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-1.5">{children}</div>;
}
