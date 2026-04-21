/** Tela de perfil — mostra preferências e permite refazer quiz/sair. */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import type { Note } from "@/lib/types";
import { BottomNav } from "@/components/BottomNav";
import { LogOut, Sparkles } from "lucide-react";

export const Route = createFileRoute("/perfil")({
  component: ProfileScreen,
});

function ProfileScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const preferences = useAuthStore((s) => s.preferences);
  const signOut = useAuthStore((s) => s.signOut);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    supabase
      .from("notes")
      .select("*")
      .then(({ data }) => setNotes(data ?? []));
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="glass rounded-3xl p-7 max-w-sm text-center">
          <h2 className="text-xl font-bold">Você não está logado</h2>
          <Link
            to="/auth"
            className="mt-5 inline-flex items-center justify-center rounded-2xl gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Entrar
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const fav = notes.filter((n) => preferences?.favorite_note_ids.includes(n.id));
  const dis = notes.filter((n) => preferences?.disliked_note_ids.includes(n.id));

  return (
    <div className="min-h-screen px-5 pt-10 pb-32 space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.25em] text-accent font-semibold">Perfil</p>
        <h1 className="mt-1 text-2xl font-bold">{user.email}</h1>
      </header>

      <section className="glass rounded-2xl p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">Notas favoritas</h2>
        {fav.length === 0 ? (
          <p className="text-sm text-muted-foreground">Você ainda não fez o quiz.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {fav.map((n) => (
              <span
                key={n.id}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-foreground"
              >
                {n.icon} {n.name}
              </span>
            ))}
          </div>
        )}
      </section>

      {dis.length > 0 && (
        <section className="glass rounded-2xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider mb-3">Evita</h2>
          <div className="flex flex-wrap gap-2">
            {dis.map((n) => (
              <span
                key={n.id}
                className="text-xs px-3 py-1.5 rounded-full bg-destructive/20 border border-destructive/40 text-foreground"
              >
                {n.icon} {n.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <Link
        to="/quiz"
        className="glass rounded-2xl p-4 flex items-center gap-3 hover:bg-white/5 transition"
      >
        <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent-foreground" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Refazer quiz</p>
          <p className="text-xs text-muted-foreground">Atualize seu perfil olfativo</p>
        </div>
        <span className="text-accent">→</span>
      </Link>

      <button
        type="button"
        onClick={async () => {
          await signOut();
          navigate({ to: "/" });
        }}
        className="w-full glass rounded-2xl p-4 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition"
      >
        <LogOut className="w-5 h-5" />
        <span className="text-sm font-semibold">Sair</span>
      </button>

      <BottomNav />
    </div>
  );
}
