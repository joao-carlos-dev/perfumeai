/**
 * Server function do chatbot.
 *
 * Usa o Lovable AI Gateway (Gemini) com function calling.
 * O modelo decide quando chamar `recomendar_perfumes(notas, genero)` para
 * que a resposta inclua perfumes reais do catálogo (não inventados).
 */

import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Perfume, PerfumeNote, RecommendedPerfume } from "@/lib/types";

const SYSTEM_PROMPT = `Você é "Aroma", a assistente especialista do PerfumeAI.
Tom: empático, sensorial, culto sobre perfumaria; nunca arrogante.
Sempre que o usuário pedir indicação, comparação ou descrever um momento/sensação,
você DEVE chamar a função "recomendar_perfumes" com:
- notas: lista das famílias/notas olfativas relevantes (ex: ["floral","baunilha","oud"])
- genero: "masculino", "feminino", "unisex" ou "all"
Depois, escreva uma resposta curta (até 4 frases) explicando POR QUE aqueles perfumes combinam,
mencionando ao menos uma característica técnica (família olfativa, fixação, ocasião).
Se a pergunta for puramente conceitual (ex: "o que é nota de saída?"), responda direto sem chamar a função.
Responda sempre em português do Brasil.`;

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

/** Carrega perfumes do catálogo com notas (para o motor de recomendação interno do chat). */
async function loadCatalog(): Promise<Perfume[]> {
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

/** Recomendação simples baseada em palavras-chave de notas/famílias vindas do LLM. */
function pickPerfumesByKeywords(
  catalog: Perfume[],
  keywords: string[],
  gender: string,
  limit = 3
): RecommendedPerfume[] {
  const kw = keywords.map((k) => k.toLowerCase());
  const scored = catalog
    .filter((p) => gender === "all" || p.gender === gender || p.gender === "unisex")
    .map((p) => {
      let score = 0;
      const matched: string[] = [];
      for (const pn of p.notes) {
        const noteName = pn.note.name.toLowerCase();
        const family = pn.note.family.toLowerCase();
        for (const k of kw) {
          if (noteName.includes(k) || k.includes(noteName) || family.includes(k) || k.includes(family)) {
            score += pn.intensity;
            matched.push(pn.note.name);
          }
        }
      }
      score += 0.3 * p.popularity_score;
      const compatibility = Math.max(1, Math.min(100, Math.round((score / 4) * 100)));
      return {
        ...p,
        final_score: score,
        compatibility,
        matching_notes: Array.from(new Set(matched)),
      } as RecommendedPerfume;
    })
    .filter((p) => p.final_score > 0)
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, limit);

  return scored;
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .inputValidator(
    (input: { userId: string; message: string; history: { role: string; content: string }[] }) =>
      input
  )
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      return {
        reply: "O assistente está temporariamente indisponível (chave de IA ausente).",
        perfumes: [] as RecommendedPerfume[],
      };
    }

    // Salva mensagem do usuário
    await supabaseAdmin.from("chat_messages").insert({
      user_id: data.userId,
      role: "user",
      content: data.message,
    });

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...data.history.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: data.message },
    ];

    const tools = [
      {
        type: "function",
        function: {
          name: "recomendar_perfumes",
          description:
            "Busca no catálogo do PerfumeAI perfumes reais que combinam com as notas/famílias informadas.",
          parameters: {
            type: "object",
            properties: {
              notas: {
                type: "array",
                items: { type: "string" },
                description: "Lista de notas ou famílias olfativas (ex: floral, baunilha, oud, cítrico).",
              },
              genero: {
                type: "string",
                enum: ["masculino", "feminino", "unisex", "all"],
                description: "Preferência de gênero do perfume.",
              },
            },
            required: ["notas"],
          },
        },
      },
    ];

    // Primeira chamada: pode pedir tool call
    const firstRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools,
        tool_choice: "auto",
      }),
    });

    if (!firstRes.ok) {
      const txt = await firstRes.text();
      console.error("AI gateway error:", firstRes.status, txt);
      const friendly =
        firstRes.status === 429
          ? "Muitas mensagens em pouco tempo. Tente novamente em alguns instantes."
          : firstRes.status === 402
            ? "Os créditos do assistente acabaram. Avise o administrador."
            : "Tive um probleminha técnico para responder agora.";
      return { reply: friendly, perfumes: [] as RecommendedPerfume[] };
    }

    const firstData = await firstRes.json();
    const choice = firstData.choices?.[0];
    const toolCalls: ToolCall[] = choice?.message?.tool_calls ?? [];

    let perfumes: RecommendedPerfume[] = [];
    let reply: string = choice?.message?.content ?? "";

    if (toolCalls.length > 0) {
      const catalog = await loadCatalog();

      const toolResponses = toolCalls.map((tc) => {
        try {
          const args = JSON.parse(tc.function.arguments || "{}");
          const notas: string[] = Array.isArray(args.notas) ? args.notas : [];
          const genero: string = typeof args.genero === "string" ? args.genero : "all";
          const result = pickPerfumesByKeywords(catalog, notas, genero, 3);
          if (result.length > 0) perfumes = result;
          return {
            role: "tool" as const,
            tool_call_id: tc.id,
            content: JSON.stringify(
              result.map((p) => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                compatibility: p.compatibility,
                matching_notes: p.matching_notes,
              }))
            ),
          };
        } catch {
          return {
            role: "tool" as const,
            tool_call_id: tc.id,
            content: "[]",
          };
        }
      });

      // Segunda chamada: pede resposta natural com base nos perfumes
      const secondRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [...messages, choice.message, ...toolResponses],
        }),
      });

      if (secondRes.ok) {
        const secondData = await secondRes.json();
        reply = secondData.choices?.[0]?.message?.content ?? reply;
      }
    }

    if (!reply) {
      reply = "Posso te indicar perfumes? Me conta uma ocasião ou notas que você gosta.";
    }

    // Salva resposta do assistente
    await supabaseAdmin.from("chat_messages").insert({
      user_id: data.userId,
      role: "assistant",
      content: reply,
      perfume_ids: perfumes.map((p) => p.id),
    });

    return { reply, perfumes };
  });
