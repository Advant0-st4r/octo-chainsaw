export type CogType = "high" | "low" | "latent" | "lever";

export const COG_META: Record<CogType, { label: string; glyph: string; cls: string; bgCls: string; desc: string }> = {
  high:   { label: "High-density", glyph: "◆", cls: "text-cog-high",   bgCls: "bg-cog-high/10",   desc: "Novel output, compounding" },
  lever:  { label: "Leveraged",    glyph: "◈", cls: "text-cog-lever",  bgCls: "bg-cog-lever/10",  desc: "Unlocks downstream chains" },
  low:    { label: "Low-density",  glyph: "◇", cls: "text-cog-low",    bgCls: "bg-cog-low/10",    desc: "Necessary overhead, compress" },
  latent: { label: "Latent",       glyph: "◌", cls: "text-cog-latent", bgCls: "bg-cog-latent/10", desc: "Blocked — eliminate or buffer" },
};
