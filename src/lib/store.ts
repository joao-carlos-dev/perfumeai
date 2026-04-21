/**
 * Store global com Zustand.
 * Mantém o usuário autenticado e suas preferências em memória,
 * sincronizando com o cliente Supabase.
 */
import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface UserPreferences {
  favorite_note_ids: string[];
  disliked_note_ids: string[];
  preferred_families: string[];
  gender_preference: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  preferences: UserPreferences | null;
  onboarded: boolean;

  /** Define o usuário atual (chamado pelo listener de auth). */
  setUser: (user: User | null) => void;

  /** Carrega preferências e flag onboarded do banco. */
  loadProfile: () => Promise<void>;

  /** Faz logout limpando estado local. */
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  preferences: null,
  onboarded: false,

  setUser: (user) => set({ user, loading: false }),

  loadProfile: async () => {
    const { user } = get();
    if (!user) return;

    // Carrega perfil + preferências em paralelo
    const [{ data: profile }, { data: prefs }] = await Promise.all([
      supabase.from("profiles").select("onboarded").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("user_preferences")
        .select("favorite_note_ids, disliked_note_ids, preferred_families, gender_preference")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    set({
      onboarded: profile?.onboarded ?? false,
      preferences: prefs
        ? {
            favorite_note_ids: prefs.favorite_note_ids ?? [],
            disliked_note_ids: prefs.disliked_note_ids ?? [],
            preferred_families: prefs.preferred_families ?? [],
            gender_preference: prefs.gender_preference ?? "all",
          }
        : null,
    });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, preferences: null, onboarded: false });
  },
}));

/**
 * Inicializa o listener de autenticação.
 * Deve ser chamado uma vez no client (no root component).
 */
export function initAuthListener() {
  // Listener primeiro, depois getSession (evita race conditions)
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setUser(session?.user ?? null);
    // Adia o load para não bloquear o callback
    if (session?.user) {
      setTimeout(() => useAuthStore.getState().loadProfile(), 0);
    }
  });

  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState().setUser(session?.user ?? null);
    if (session?.user) {
      useAuthStore.getState().loadProfile();
    }
  });
}
