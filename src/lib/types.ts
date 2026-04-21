/** Tipos de domínio compartilhados entre client e server. */

export interface Note {
  id: string;
  name: string;
  family: string;
  icon: string;
  color: string;
  description: string | null;
}

export interface PerfumeNote {
  note_id: string;
  note_type: "top" | "heart" | "base" | string;
  intensity: number;
  note: Note;
}

export interface Perfume {
  id: string;
  name: string;
  brand: string;
  gender: string;
  description: string | null;
  image_url: string | null;
  year: number | null;
  price_range: string | null;
  is_new: boolean;
  popularity_score: number;
  notes: PerfumeNote[];
}

export interface RecommendedPerfume extends Perfume {
  /** Compatibilidade 0..100 calculada pelo engine. */
  compatibility: number;
  /** Score bruto do engine (peso favoritos - rejeitadas + popularidade). */
  final_score: number;
  /** Notas que combinam com as favoritas do usuário. */
  matching_notes: string[];
}
