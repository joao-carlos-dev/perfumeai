/** Quiz de notas olfativas — seleciona favoritas e rejeitadas. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Heart, X, Loader2, ArrowRight } from "lucide-react";
import type { Note } from "@/lib/types";

export const Route = createFileRoute("/quiz")({
  component: QuizScreen,
});

type Step = "favorites" | "dislikes" | "gender";

function QuizScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const loadProfile = useAuthStore((s) => s.loadProfile);

  const [notes, setNotes] = useState<Note[]>([]);
  const [step, setStep] = useState<Step>("favorites");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [dislikes, setDislikes] = useState<Set<string>>(new Set());
  const [gender, setGender] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  // Redireciona não-logados para auth
  useEffect(() => {
    if (!user) {
      const t = setTimeout(() => navigate({ to: "/auth" }), 100);
      return () => clearTimeout(t);
    }
  }, [user, navigate]);

  useEffect(() => {
    supabase
      .from("notes")
      .select("*")
      .order("family")
      .then(({ data }) => setNotes(data ?? []));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, Note[]>();
    notes.forEach((n) => {
      if (!map.has(n.family)) map.set(n.family, []);
      map.get(n.family)!.push(n);
    });
    return Array.from(map.entries());
  }, [notes]);

  function toggle(set: Set<string>, setSet: (s: Set<string>) => void, id: string, opposite: Set<string>) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      // Não pode estar nos dois lados
      if (opposite.has(id)) {
        const cleanOpp = new Set(opposite);
        cleanOpp.delete(id);
        if (step === "favorites") setDislikes(cleanOpp);
        else setFavorites(cleanOpp);
      }
    }
    setSet(next);
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    try {
      // Famílias preferidas = famílias presentes nos favoritos
      const families = Array.from(
        new Set(notes.filter((n) => favorites.has(n.id)).map((n) => n.family))
      );

      const [pref, prof] = await Promise.all([
        supabase
          .from("user_preferences")
          .update({
            favorite_note_ids: Array.from(favorites),
            disliked_note_ids: Array.from(dislikes),
            preferred_families: families,
            gender_preference: gender,
          })
          .eq("user_id", user.id),
        supabase.from("profiles").update({ onboarded: true }).eq("user_id", user.id),
      ]);

      if (pref.error) throw pref.error;
      if (prof.error) throw prof.error;

      await loadProfile();
      toast.success("Perfil olfativo salvo! ✨");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const current = step === "favorites" ? favorites : step === "dislikes" ? dislikes : null;
  const setCurrent = step === "favorites" ? setFavorites : setDislikes;
  const opposite = step === "favorites" ? dislikes : favorites;

  return (
    <div className="min-h-screen pb-28 px-5 pt-10">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">
          Quiz de notas
        </p>
        <h1 className="mt-1 text-2xl font-bold">
          {step === "favorites" && "Quais notas você ama?"}
          {step === "dislikes" && "Quais você prefere evitar?"}
          {step === "gender" && "Sua preferência olfativa"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {step === "favorites" && "Selecione pelo menos 3"}
          {step === "dislikes" && "Opcional — ajuda a refinar (pule se quiser)"}
          {step === "gender" && "Escolha o tipo de fragrância"}
        </p>

        {/* Progresso */}
        <div className="mt-4 flex gap-1.5">
          {(["favorites", "dislikes", "gender"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                ["favorites", "dislikes", "gender"].indexOf(step) >= i
                  ? "gradient-primary"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </header>

      {step !== "gender" && current && (
        <div className="space-y-6">
          {grouped.map(([family, items]) => (
            <section key={family}>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {family}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {items.map((note) => {
                  const selected = current.has(note.id);
                  const isOpposite = opposite.has(note.id);
                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => toggle(current, setCurrent, note.id, opposite)}
                      className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 p-2 border transition-all ${
                        selected
                          ? step === "favorites"
                            ? "gradient-primary border-transparent shadow-glow scale-[1.04]"
                            : "bg-destructive border-destructive shadow-lg scale-[1.04]"
                          : "glass border-white/10 hover:border-white/30"
                      } ${isOpposite ? "opacity-50" : ""}`}
                    >
                      <span className="text-2xl">{note.icon}</span>
                      <span
                        className={`text-[11px] font-medium leading-tight text-center ${
                          selected ? "text-primary-foreground" : "text-foreground"
                        }`}
                      >
                        {note.name}
                      </span>
                      {selected && (
                        <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                          {step === "favorites" ? (
                            <Heart className="w-3 h-3 fill-current text-white" />
                          ) : (
                            <X className="w-3 h-3 text-white" />
                          )}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {step === "gender" && (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { value: "feminino", label: "Feminino", icon: "🌸" },
            { value: "masculino", label: "Masculino", icon: "🪵" },
            { value: "unisex", label: "Unissex", icon: "✨" },
            { value: "all", label: "Todos", icon: "🌍" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setGender(opt.value)}
              className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                gender === opt.value
                  ? "gradient-primary border-transparent shadow-glow"
                  : "glass border-white/10"
              }`}
            >
              <span className="text-3xl">{opt.icon}</span>
              <span
                className={`text-sm font-semibold ${
                  gender === opt.value ? "text-primary-foreground" : "text-foreground"
                }`}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Footer fixo */}
      <div className="fixed bottom-0 inset-x-0 px-5 pb-6 pt-3 bg-gradient-to-t from-background via-background/90 to-transparent">
        <div className="max-w-md mx-auto flex gap-3">
          {step === "favorites" && (
            <button
              type="button"
              disabled={favorites.size < 3}
              onClick={() => setStep("dislikes")}
              className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {favorites.size < 3 ? `Selecione ${3 - favorites.size} mais` : "Continuar"}
              {favorites.size >= 3 && <ArrowRight className="w-4 h-4" />}
            </button>
          )}
          {step === "dislikes" && (
            <>
              <button
                type="button"
                onClick={() => setStep("gender")}
                className="flex-1 py-3 rounded-2xl glass text-foreground font-semibold"
              >
                Pular
              </button>
              <button
                type="button"
                onClick={() => setStep("gender")}
                className="flex-1 py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-glow flex items-center justify-center gap-2"
              >
                Continuar <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
          {step === "gender" && (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="flex-1 py-3 rounded-2xl gradient-gold text-accent-foreground font-semibold shadow-glow disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Ver minhas recomendações ✨
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
