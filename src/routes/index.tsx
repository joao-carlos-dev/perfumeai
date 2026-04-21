/** Tela inicial — Top Match + carrossel de lançamentos. */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { getRecommendations, getNewReleases } from "@/lib/recommendation.functions";
import type { Perfume, RecommendedPerfume } from "@/lib/types";
import { PerfumeCard } from "@/components/PerfumeCard";
import { BottomNav } from "@/components/BottomNav";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomeScreen,
});

function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const onboarded = useAuthStore((s) => s.onboarded);
  const loading = useAuthStore((s) => s.loading);

  const [recs, setRecs] = useState<RecommendedPerfume[]>([]);
  const [newReleases, setNewReleases] = useState<Perfume[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const releasesRef = useRef<HTMLDivElement>(null);

  // Habilita scroll horizontal via roda do mouse e arrastar (desktop)
  useEffect(() => {
    const el = releasesRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      // Se o gesto for predominantemente vertical, converte para horizontal
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        if (e.deltaY === 0) return;
        e.preventDefault();
        el.scrollBy({ left: e.deltaY, behavior: "auto" });
      }
    };

    let isDown = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (e: PointerEvent) => {
      // Só ativa drag para mouse — touch já tem scroll nativo
      if (e.pointerType !== "mouse") return;
      isDown = true;
      startX = e.clientX;
      startScroll = el.scrollLeft;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDown) return;
      el.scrollLeft = startScroll - (e.clientX - startX);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!isDown) return;
      isDown = false;
      el.releasePointerCapture(e.pointerId);
      el.style.cursor = "";
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [loadingData]);

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoadingData(true);
      try {
        const [r, n] = await Promise.all([
          getRecommendations({ data: { userId: user?.id, limit: 5 } }),
          getNewReleases(),
        ]);
        if (cancel) return;
        setRecs(r.recommendations);
        setNewReleases(n.perfumes);
      } finally {
        if (!cancel) setLoadingData(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [user?.id]);

  const top = recs[0];
  const rest = recs.slice(1);

  return (
    <div className="min-h-screen pb-32">
      <header className="px-5 pt-10 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">
              Perfume<span className="text-secondary">AI</span>
            </p>
            <h1 className="mt-1 text-2xl font-bold text-foreground">
              {user ? "Boa descoberta" : "Olá, viajante olfativo"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {onboarded
                ? "Suas recomendações personalizadas"
                : "Faça o quiz para personalizar 100%"}
            </p>
          </div>
          {!user && (
            <Link
              to="/auth"
              className="text-xs px-3 py-2 rounded-full glass text-foreground hover:bg-white/10"
            >
              Entrar
            </Link>
          )}
        </div>
      </header>

      <main className="px-5 space-y-6">
        {/* CTA Quiz */}
        {user && !onboarded && (
          <Link
            to="/quiz"
            className="glass block rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition"
          >
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-accent-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Personalize seu perfil olfativo</p>
              <p className="text-xs text-muted-foreground">
                Escolha suas notas favoritas em 1 minuto
              </p>
            </div>
            <span className="text-accent text-lg">→</span>
          </Link>
        )}

        {/* Top Match */}
        <section>
          {loadingData ? (
            <div className="glass rounded-3xl p-6 h-44 animate-pulse" />
          ) : top ? (
            <PerfumeCard perfume={top} variant="wide" />
          ) : null}
        </section>

        {/* Lançamentos */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Lançamentos
            </h2>
            <span className="text-xs text-muted-foreground">{newReleases.length} novos</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5">
            {loadingData
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="glass shrink-0 w-44 h-60 rounded-2xl animate-pulse" />
                ))
              : newReleases.map((p) => <PerfumeCard key={p.id} perfume={p} variant="horizontal" />)}
          </div>
        </section>

        {/* Mais recomendações */}
        {rest.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-3">
              Mais para você
            </h2>
            <div className="space-y-3">
              {rest.map((p) => (
                <PerfumeCard key={p.id} perfume={p} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {!loading && !user && (
          <div className="glass rounded-2xl p-5 text-center">
            <p className="text-sm text-foreground">Crie uma conta para guardar suas preferências</p>
            <Link
              to="/auth"
              className="mt-3 inline-flex items-center justify-center rounded-2xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Começar agora
            </Link>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
