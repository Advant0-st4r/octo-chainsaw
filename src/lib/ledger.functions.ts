import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EventInput = z.object({
  map_id: z.string().uuid().nullish(),
  phase_id: z.string().uuid().nullish(),
  session_label: z.string().max(200).optional().default(""),
  start_ts: z.string().datetime(),
  end_ts: z.string().datetime(),
  time_type: z.enum(["high", "low", "latent", "lever"]),
  density_score: z.number().min(0).max(100).optional(),
  blocked_flag: z.boolean().optional().default(false),
  leveraged_flag: z.boolean().optional().default(false),
  context_switch_count: z.number().int().min(0).optional().default(0),
  re_ramp_minutes: z.number().min(0).optional().default(0),
  notes: z.string().max(1000).optional().default(""),
});

export const appendSessionEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => EventInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("session_events").insert({
      user_id: userId,
      map_id: data.map_id ?? null,
      phase_id: data.phase_id ?? null,
      session_label: data.session_label,
      start_ts: data.start_ts,
      end_ts: data.end_ts,
      time_type: data.time_type,
      density_score: data.density_score ?? null,
      blocked_flag: data.blocked_flag,
      leveraged_flag: data.leveraged_flag,
      context_switch_count: data.context_switch_count,
      re_ramp_minutes: data.re_ramp_minutes,
      notes: data.notes,
      derivation_source: "manual",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listSessionEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ days: z.number().int().min(1).max(90).default(30) }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const since = new Date(Date.now() - data.days * 86400_000).toISOString();
    const { data: rows, error } = await supabase
      .from("session_events")
      .select("*")
      .gte("start_ts", since)
      .order("start_ts", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    // Rollups
    let active = 0, novel = 0, blocked = 0, leveraged = 0, reramp = 0, switches = 0;
    for (const r of rows ?? []) {
      const dur = r.duration_s ?? 0;
      active += dur;
      if (r.blocked_flag) blocked += dur; else novel += dur * ((r.density_score ?? 50) / 100);
      if (r.leveraged_flag) leveraged += dur;
      reramp += Number(r.re_ramp_minutes ?? 0);
      switches += r.context_switch_count ?? 0;
    }
    const nonBlocked = Math.max(active - blocked, 1);
    const metrics = {
      CDS: Math.round((novel / nonBlocked) * 100),
      LTR: Math.round((blocked / Math.max(active, 1)) * 100),
      LTF: Math.round((leveraged / Math.max(active, 1)) * 100),
      RCI: switches > 0 ? +(reramp / switches).toFixed(1) : 0,
      total_minutes: Math.round(active / 60),
      sessions: rows?.length ?? 0,
    };
    return { events: rows ?? [], metrics };
  });
