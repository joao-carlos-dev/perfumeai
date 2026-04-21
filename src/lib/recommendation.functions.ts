/**
 * Engine de recomendação do PerfumeAI.
 *
 * Lógica de pesos (substitui o `predict()` do modelo .joblib em produção
 * Python — aqui rodamos puro TypeScript no servidor, mantendo a mesma ideia
 * de pesos por nota favorita/rejeitada e ajuste por popularidade).
 *
 * Pesos por tipo de nota dentro do perfume:
 *   - top:   0.7
 *   - heart: 1.0
 *   - base:  0.9
 * Multiplicado pela `intensity` cadastrada no banco.
 *
 * final_score = Σ(peso_favorita) − Σ(peso_rejeitada) + bonus_familia + 0.3 * popularidade
 * compatibility (%) = clamp( normalização do final_score em escala humana, 1..100 )
 */

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Perfume, PerfumeNote, RecommendedPerfume } from "@/lib/types";

const TYPE_WEIGHT: Record<string, number> = {
  top: 0.7,
  heart: 1.0,
  base: 0.9,
};

interface ScoreInput {
  perfume: Perfume;
  favorites: Set<string>;
  dislikes: Set<string>;
  preferredFamilies: Set<string>;
}

/** Calcula final_score e compatibilidade para um perfume. */
function scorePerfume({ perfume, favorites, dislikes, preferredFamilies }: ScoreInput) {
  let positive = 0;
  let negative = 0;
  let familyBonus = 0;
  const matching: string[] = [];

  for (const pn of perfume.notes) {
    const w = (TYPE_WEIGHT[pn.note_type] ?? 1.0) * (pn.intensity ?? 1.0);
    if (favorites.has(pn.note_id)) {
      positive += w;
      matching.push(pn.note.name);
    }
    if (dislikes.has(pn.note_id)) {
      negative += w * 1.5; // penaliza mais forte
    }
    if (preferredFamilies.has(pn.note.family)) {
      familyBonus += 0.15;
    }
  }

  const popularity = perfume.popularity_score ?? 0.5;
  const final_score = positive - negative + familyBonus + 0.3 * popularity;

  // Normalização heurística para 0..100 (ajuste fino do "predict")
  // Considera que ~6 pontos é um perfume praticamente perfeito.
  const compatibility = Math.max(1, Math.min(100, Math.round((final_score / 6) * 100)));

  return { final_score, compatibility, matching_notes: Array.from(new Set(matching)) };
}

/** Carrega perfumes com suas notas usando o admin client (catálogo público). */
async function fetchAllPerfumes(): Promise<Perfume[]> {
  const { data, error } = await supabaseAdmin
    .from("perfumes")
    .select(
      `id, name, brand, gender, description, image_url, year, price_range,
       is_new, popularity_score,
       notes:perfume_notes (
         note_id, note_type, intensity,
         note:notes ( id, name, family, icon, color, description )
       )`
    );

  if (error) throw error;

  return (data ?? []).map((p) => ({
    ...p,
    notes: (p.notes ?? []) as unknown as PerfumeNote[],
  })) as Perfume[];
}

/**
 * Server function: retorna o Top N de perfumes recomendados para o usuário.
 * Se o usuário ainda não fez o quiz, retorna por popularidade.
 */
export const getRecommendations = createServerFn({ method: "POST" })
  .inputValidator((input: { userId?: string; limit?: number; gender?: string }) => input)
  .handler(async ({ data }) => {
    const limit = data.limit ?? 5;

    // Carrega preferências (se houver userId)
    let favorites = new Set<string>();
    let dislikes = new Set<string>();
    let preferredFamilies = new Set<string>();
    let genderPref: string = data.gender ?? "all";

    if (data.userId) {
      const { data: prefs } = await supabaseAdmin
        .from("user_preferences")
        .select("favorite_note_ids, disliked_note_ids, preferred_families, gender_preference")
        .eq("user_id", data.userId)
        .maybeSingle();

      if (prefs) {
        favorites = new Set(prefs.favorite_note_ids ?? []);
        dislikes = new Set(prefs.disliked_note_ids ?? []);
        preferredFamilies = new Set(prefs.preferred_families ?? []);
        genderPref = data.gender ?? prefs.gender_preference ?? "all";
      }
    }

    let perfumes = await fetchAllPerfumes();

    // Filtra por gênero preferido (se diferente de "all")
    if (genderPref && genderPref !== "all") {
      perfumes = perfumes.filter((p) => p.gender === genderPref || p.gender === "unisex");
    }

    const scored: RecommendedPerfume[] = perfumes.map((perfume) => {
      const { final_score, compatibility, matching_notes } = scorePerfume({
        perfume,
        favorites,
        dislikes,
        preferredFamilies,
      });
      return { ...perfume, final_score, compatibility, matching_notes };
    });

    // Ordena por final_score desc; se nenhum quiz feito, prioriza popularidade
    scored.sort((a, b) => {
      if (favorites.size === 0) return b.popularity_score - a.popularity_score;
      return b.final_score - a.final_score;
    });

    return { recommendations: scored.slice(0, limit) };
  });

/** Server function: lista de novidades (lançamentos). */
export const getNewReleases = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("perfumes")
    .select(
      `id, name, brand, gender, description, image_url, year, price_range,
       is_new, popularity_score,
       notes:perfume_notes (
         note_id, note_type, intensity,
         note:notes ( id, name, family, icon, color, description )
       )`
    )
    .eq("is_new", true)
    .order("popularity_score", { ascending: false })
    .limit(10);

  if (error) throw error;

  return {
    perfumes: (data ?? []).map((p) => ({
      ...p,
      notes: (p.notes ?? []) as unknown as PerfumeNote[],
    })) as Perfume[],
  };
});
