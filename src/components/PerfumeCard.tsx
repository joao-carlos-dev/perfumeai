/** Card visual para um perfume com glass morphism. */
import type { Perfume, RecommendedPerfume } from "@/lib/types";
import { CompatibilityBadge } from "./CompatibilityBadge";

interface Props {
  perfume: Perfume | RecommendedPerfume;
  variant?: "horizontal" | "compact" | "wide";
}

function isRecommended(p: Perfume | RecommendedPerfume): p is RecommendedPerfume {
  return "compatibility" in p;
}

export function PerfumeCard({ perfume, variant = "compact" }: Props) {
  const topNotes = perfume.notes.slice(0, 4);

  if (variant === "horizontal") {
    // Card de carrossel horizontal (lançamentos)
    return (
      <div className="glass shrink-0 w-44 rounded-2xl p-4 flex flex-col gap-3 hover:scale-[1.03] transition-transform">
        <div className="aspect-square rounded-xl gradient-primary flex items-center justify-center text-4xl shadow-glow">
          {topNotes[0]?.note.icon ?? "🧴"}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{perfume.brand}</p>
          <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
            {perfume.name}
          </h3>
          {perfume.is_new && (
            <span className="self-start mt-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground bg-accent rounded-full px-2 py-0.5">
              Novo
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === "wide") {
    // Card "Top Match" hero
    return (
      <div className="glass relative overflow-hidden rounded-3xl p-6 animate-fade-in-up">
        {/* glow decorativo */}
        <div className="pointer-events-none absolute -top-20 -right-20 w-60 h-60 rounded-full bg-secondary/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-primary/30 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="aspect-square w-24 sm:w-28 rounded-2xl gradient-primary flex items-center justify-center text-5xl shadow-glow shrink-0 animate-float">
            {topNotes[0]?.note.icon ?? "🧴"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-accent font-semibold">
              Top match para você
            </p>
            <h2 className="mt-1 text-2xl font-bold text-foreground leading-tight">
              {perfume.name}
            </h2>
            <p className="text-sm text-muted-foreground">{perfume.brand}</p>
            <p className="mt-2 text-sm text-foreground/80 line-clamp-2">
              {perfume.description}
            </p>
          </div>
          {isRecommended(perfume) && (
            <div className="hidden sm:block">
              <CompatibilityBadge value={perfume.compatibility} size={88} />
            </div>
          )}
        </div>

        {/* notas */}
        <div className="relative mt-5 flex flex-wrap gap-2">
          {topNotes.map((pn) => (
            <span
              key={pn.note_id}
              className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-foreground/90"
            >
              {pn.note.icon} {pn.note.name}
            </span>
          ))}
        </div>

        {isRecommended(perfume) && (
          <div className="relative mt-5 flex sm:hidden items-center justify-between">
            <CompatibilityBadge value={perfume.compatibility} size={72} strokeWidth={6} />
            {perfume.matching_notes.length > 0 && (
              <p className="text-xs text-muted-foreground text-right max-w-[60%]">
                Combina com: <span className="text-foreground/90">{perfume.matching_notes.slice(0, 3).join(", ")}</span>
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // compact (default — usado em listas verticais)
  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
      <div className="aspect-square w-16 rounded-xl gradient-primary flex items-center justify-center text-3xl shrink-0">
        {topNotes[0]?.note.icon ?? "🧴"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {perfume.brand}
        </p>
        <h3 className="text-sm font-semibold text-foreground truncate">{perfume.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
          {topNotes.map((n) => n.note.name).join(" · ")}
        </p>
      </div>
      {isRecommended(perfume) && (
        <CompatibilityBadge value={perfume.compatibility} size={56} strokeWidth={5} label="" />
      )}
    </div>
  );
}
