import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const EMBED_URL = "https://api.openai.com/v1/embeddings";
const MODEL = "gpt-5.2";
const EMBED_MODEL = "text-embedding-3-small";

const GoalInput = z.object({
  goal: z.string().trim().min(6).max(2000),
  metrics: z.string().trim().min(3).max(1000),
  deliverables: z.string().trim().max(1000).optional().default(""),
  constraints: z.string().trim().max(1000).optional().default(""),
  horizon: z.string().trim().max(500).optional().default(""),
  context: z.string().trim().max(2000).optional().default(""),
});

const SYSTEM = `You are a Cognitive Time Optimization Engine operating within the CIaaS framework.

You analyze any task, goal, or objective and produce a hyper-precise execution map that maximizes:
- Cognitive Density Score (CDS): ratio of novel/leveraged output to total active time
- Leveraged Time Fraction (LTF): fraction of work that unlocks downstream chains
- Compounding returns: each phase builds structural advantage for the next

Every task is decomposed into phases classified by cognitive time type:
- "high": Deep, novel, non-automatable work. Protect at all costs. Schedule first in day.
- "lever": Work whose output multiplies downstream — decisions, designs, frameworks. Highest priority.
- "low": Necessary coordination/overhead. Compress, batch, delegate, or automate.
- "latent": Blocked states. Identify causes. Buffer or eliminate. Never schedule deliberately.

RULES:
1. Sequence lever phases before high phases when possible — they clear the path.
2. Never schedule low-density work adjacent to high-density work without a re-ramp buffer.
3. Any phase with latent risk must have a named unblocking action.
4. Each phase must have a concrete compounding mechanism.
5. Leverage multiplier = downstream value / direct phase value. Must be ≥ 1.0.
6. Flag cognitive waste risks explicitly.

You MUST call the function "emit_execution_map" with the structured map. Do not respond with prose.`;

const MAP_TOOL = {
  type: "function" as const,
  function: {
    name: "emit_execution_map",
    description: "Emit the cognitive-time-optimized execution map.",
    parameters: {
      type: "object",
      additionalProperties: false,
      required: [
        "summary","leverage_sequence_rationale","total_cds_estimate","total_ltf_estimate",
        "phases","execution_principles","cognitive_waste_risks","re_ramp_protocol","scalability_mechanism"
      ],
      properties: {
        summary: { type: "string" },
        leverage_sequence_rationale: { type: "string" },
        total_cds_estimate: { type: "number" },
        total_ltf_estimate: { type: "number" },
        phases: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["id","name","session_type","duration_minutes","cds_contribution","leverage_multiplier","description","actions","unlocks","compounding_mechanism","cognitive_waste_risk"],
            properties: {
              id: { type: "integer" },
              name: { type: "string" },
              session_type: { type: "string", enum: ["high","low","latent","lever"] },
              duration_minutes: { type: "integer" },
              cds_contribution: { type: "number" },
              leverage_multiplier: { type: "number" },
              description: { type: "string" },
              actions: { type: "array", items: { type: "string" } },
              unlocks: { type: "array", items: { type: "string" } },
              compounding_mechanism: { type: "string" },
              cognitive_waste_risk: { type: "string" },
            },
          },
        },
        execution_principles: { type: "array", items: { type: "string" } },
        cognitive_waste_risks: { type: "array", items: { type: "string" } },
        re_ramp_protocol: { type: "string" },
        scalability_mechanism: { type: "string" },
      },
    },
  },
};

async function callOpenAI(messages: any[]) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");

  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: [MAP_TOOL],
      tool_choice: { type: "function", function: { name: "emit_execution_map" } },
      reasoning_effort: "medium",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("OpenAI error", res.status, body);
    if (res.status === 429) throw new Error("Rate limited by OpenAI. Try again in a moment.");
    if (res.status === 401) throw new Error("OpenAI API key invalid.");
    throw new Error(`OpenAI error ${res.status}`);
  }
  const data = await res.json();
  const call = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error("Model returned no tool call");
  return JSON.parse(call.function.arguments);
}

async function embed(input: string[]) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured");
  const res = await fetch(EMBED_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: EMBED_MODEL, input, dimensions: 1536 }),
  });
  if (!res.ok) {
    const t = await res.text(); console.error("Embed error", res.status, t);
    throw new Error(`Embedding error ${res.status}`);
  }
  const data = await res.json();
  return data.data.map((d: any) => d.embedding as number[]);
}

async function checkRateLimit(supabase: any, userId: string) {
  const window = new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000).toISOString();
  const { data } = await supabase
    .from("usage_counters")
    .select("count")
    .eq("user_id", userId).eq("window_start", window).eq("kind", "map_create")
    .maybeSingle();
  if (data && data.count >= 10) throw new Error("Hourly rate limit reached (10 maps/hour).");
  await supabase.from("usage_counters").upsert({
    user_id: userId, window_start: window, kind: "map_create", count: (data?.count ?? 0) + 1,
  });
}

async function ragContext(supabase: any, queryText: string): Promise<string> {
  try {
    const [vec] = await embed([queryText]);
    const { data, error } = await supabase.rpc("match_user_chunks", {
      query_embedding: vec, match_count: 6, min_similarity: 0.25,
    });
    if (error || !data?.length) return "";
    let total = 0;
    const picked: string[] = [];
    for (const c of data) {
      const t = (c.content as string).slice(0, 1200);
      total += t.length;
      if (total > 10_000) break;
      picked.push(`[sim=${c.similarity.toFixed(2)}] ${t}`);
    }
    return picked.length ? `\n\nRELEVANT PRIOR WORK (retrieved from your archive — use as context, do not repeat verbatim):\n${picked.join("\n---\n")}` : "";
  } catch (e) {
    console.warn("RAG failed (non-fatal):", e);
    return "";
  }
}

export const createMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => GoalInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await checkRateLimit(supabase, userId);

    const userMsg =
      `TASK / GOAL: ${data.goal}\n` +
      `SUCCESS METRICS: ${data.metrics}\n` +
      `REQUIRED DELIVERABLES: ${data.deliverables || "n/a"}\n` +
      `CONSTRAINTS: ${data.constraints || "n/a"}\n` +
      `TIME HORIZON: ${data.horizon || "n/a"}\n` +
      `ADDITIONAL CONTEXT: ${data.context || "none"}\n\n` +
      `Produce the optimal cognitive time execution map for this.`;

    const prior = await ragContext(supabase, `${data.goal}\n${data.metrics}\n${data.context}`);

    const map = await callOpenAI([
      { role: "system", content: SYSTEM + prior },
      { role: "user", content: userMsg },
    ]);

    // Persist
    const { data: goal, error: ge } = await supabase
      .from("goals")
      .insert({
        user_id: userId,
        title: data.goal,
        success_metrics: data.metrics,
        deliverables: data.deliverables,
        constraints: data.constraints,
        horizon: data.horizon,
        context: data.context,
      })
      .select().single();
    if (ge) throw new Error(ge.message);

    const { data: mapRow, error: me } = await supabase
      .from("execution_maps")
      .insert({
        user_id: userId,
        goal_id: goal.id,
        summary: map.summary,
        leverage_rationale: map.leverage_sequence_rationale,
        cds_estimate: map.total_cds_estimate,
        ltf_estimate: map.total_ltf_estimate,
        re_ramp_protocol: map.re_ramp_protocol,
        scalability_mechanism: map.scalability_mechanism,
        model: MODEL,
      })
      .select().single();
    if (me) throw new Error(me.message);

    const phases = (map.phases ?? []).map((p: any, i: number) => ({
      map_id: mapRow.id, user_id: userId, ord: i,
      name: p.name, session_type: p.session_type,
      duration_minutes: p.duration_minutes ?? null,
      cds_contribution: p.cds_contribution ?? null,
      leverage_multiplier: p.leverage_multiplier ?? null,
      description: p.description,
      actions: p.actions ?? [],
      unlocks: p.unlocks ?? [],
      compounding_mechanism: p.compounding_mechanism,
      cognitive_waste_risk: p.cognitive_waste_risk,
    }));
    if (phases.length) {
      const { error } = await supabase.from("phases").insert(phases);
      if (error) throw new Error(error.message);
    }

    if (map.execution_principles?.length) {
      await supabase.from("principles").insert(
        map.execution_principles.map((t: string, i: number) => ({ map_id: mapRow.id, user_id: userId, ord: i, text: t }))
      );
    }
    if (map.cognitive_waste_risks?.length) {
      await supabase.from("waste_risks").insert(
        map.cognitive_waste_risks.map((t: string, i: number) => ({ map_id: mapRow.id, user_id: userId, ord: i, text: t }))
      );
    }

    // Embed map summary + each phase for RAG (fire-and-forget tolerant)
    try {
      const chunks: { source_type: string; source_id: string; content: string }[] = [
        { source_type: "map_summary", source_id: mapRow.id, content: `${data.goal}\n${map.summary}\n${map.leverage_sequence_rationale}` },
        ...((map.phases ?? []).map((p: any) => ({
          source_type: "phase",
          source_id: mapRow.id,
          content: `${p.name} [${p.session_type}]\n${p.description}\nCompounding: ${p.compounding_mechanism}\nUnlocks: ${(p.unlocks || []).join("; ")}`,
        }))),
      ];
      const vecs = await embed(chunks.map(c => c.content.slice(0, 6000)));
      await supabase.from("rag_chunks").insert(
        chunks.map((c, i) => ({
          user_id: userId, source_type: c.source_type, source_id: c.source_id,
          map_id: mapRow.id, chunk_ord: i, content: c.content, embedding: vecs[i],
        }))
      );
    } catch (e) {
      console.warn("Embedding persist failed:", e);
    }

    return { map_id: mapRow.id };
  });

export const listMaps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("execution_maps")
      .select("id, summary, cds_estimate, ltf_estimate, created_at, goals(title)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data;
  });

export const getMap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: map }, { data: phases }, { data: principles }, { data: risks }] = await Promise.all([
      supabase.from("execution_maps").select("*, goals(*)").eq("id", data.id).single(),
      supabase.from("phases").select("*").eq("map_id", data.id).order("ord"),
      supabase.from("principles").select("*").eq("map_id", data.id).order("ord"),
      supabase.from("waste_risks").select("*").eq("map_id", data.id).order("ord"),
    ]);
    if (!map) throw new Error("Map not found");
    return { map, phases: phases ?? [], principles: principles ?? [], risks: risks ?? [] };
  });
