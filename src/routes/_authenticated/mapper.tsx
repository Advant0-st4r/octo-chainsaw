import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createMap } from "@/lib/architect.functions";
import { COG_META } from "@/lib/cog-types";

export const Route = createFileRoute("/_authenticated/mapper")({
  head: () => ({ meta: [{ title: "Mapper · Cognitive Time Architect" }] }),
  component: MapperPage,
});

function MapperPage() {
  const navigate = useNavigate();
  const create = useServerFn(createMap);
  const [form, setForm] = useState({ goal: "", metrics: "", deliverables: "", constraints: "", horizon: "", context: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const mut = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: (r) => {
      toast.success("Execution map ready.");
      navigate({ to: "/archive/$id", params: { id: r.map_id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canRun = form.goal.trim().length > 5 && form.metrics.trim().length > 3;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Compose</div>
      <h1 className="mt-1 text-2xl font-light tracking-tight">New execution map</h1>
      <p className="mt-2 text-xs text-muted-foreground max-w-xl">
        Enter the goal. The Architect decomposes it into cognitive-time-typed phases,
        ordered by leverage and grounded in your prior archive.
      </p>

      <div className="mt-8 space-y-5">
        <Field label="Task / Goal *" multiline rows={3}
          placeholder="e.g. Ship the first cognitive-time dashboard pilot to 5 design partners"
          value={form.goal} onChange={set("goal")} />
        <Field label="Success metrics *" multiline rows={2}
          placeholder="e.g. ≥3 partners using daily, CDS estimate ≥ 60%, NPS ≥ 40"
          value={form.metrics} onChange={set("metrics")} />
        <Field label="Required deliverables" multiline rows={2}
          placeholder="e.g. Auth, ledger, archive, RAG-augmented mapper"
          value={form.deliverables} onChange={set("deliverables")} />
        <Field label="Constraints" multiline rows={2}
          placeholder="e.g. Solo operator, 48h horizon, free tier, no team dependencies"
          value={form.constraints} onChange={set("constraints")} />
        <Field label="Time horizon"
          placeholder="e.g. 48 hours to first working loop"
          value={form.horizon} onChange={set("horizon")} />
        <Field label="Additional context" multiline rows={2}
          placeholder="Skills, tools, prior attempts, anything relevant"
          value={form.context} onChange={set("context")} />

        <button
          disabled={!canRun || mut.isPending}
          onClick={() => mut.mutate()}
          className="w-full rounded-md bg-primary text-primary-foreground py-3 text-[11px] uppercase tracking-[0.18em] disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed"
        >
          {mut.isPending ? "Computing execution map…" : "Map cognitive execution ◈"}
        </button>

        <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-[0.15em] text-muted-foreground pt-2">
          {(Object.keys(COG_META) as Array<keyof typeof COG_META>).map(k => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={COG_META[k].cls}>{COG_META[k].glyph}</span>
              <span>{COG_META[k].label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline, rows }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; rows?: number;
}) {
  const shared = "w-full bg-input border border-border rounded-md px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-ring transition-colors";
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{label}</div>
      {multiline
        ? <textarea rows={rows ?? 3} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className={shared + " resize-y"} />
        : <input placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className={shared} />}
    </div>
  );
}
