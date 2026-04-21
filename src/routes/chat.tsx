/** Tela de chat com Aroma, a assistente de perfumaria. */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { sendChatMessage } from "@/lib/chat.functions";
import type { RecommendedPerfume } from "@/lib/types";
import { PerfumeCard } from "@/components/PerfumeCard";
import { BottomNav } from "@/components/BottomNav";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/chat")({
  component: ChatScreen,
});

interface UIMessage {
  role: "user" | "assistant";
  content: string;
  perfumes?: RecommendedPerfume[];
}

const SUGGESTIONS = [
  "Quero algo doce para a noite",
  "Perfume amadeirado para o trabalho",
  "Algo cítrico e leve para o verão",
  "Diferença entre nota de saída e fundo?",
];

function ChatScreen() {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      role: "assistant",
      content:
        "Oi! Eu sou a Aroma 🌸 — sua especialista em perfumaria. Me conta uma ocasião, sensação ou notas que você ama, e eu sugiro perfumes do nosso catálogo.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || !user) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const { reply, perfumes } = await sendChatMessage({
        data: { userId: user.id, message: trimmed, history },
      });
      setMessages((m) => [...m, { role: "assistant", content: reply, perfumes }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Tive um probleminha técnico. Pode tentar de novo?" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="glass rounded-3xl p-7 max-w-sm text-center">
          <Sparkles className="w-8 h-8 mx-auto text-accent mb-3" />
          <h2 className="text-xl font-bold">Converse com a Aroma</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie uma conta gratuita para conversar com sua assistente de perfumaria.
          </p>
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

  return (
    <div className="min-h-screen flex flex-col pb-28">
      <header className="px-5 pt-10 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Aroma</h1>
            <p className="text-xs text-muted-foreground">Especialista em perfumaria</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 space-y-4 pb-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="max-w-[85%] space-y-2">
              <div
                className={`px-4 py-3 rounded-2xl text-sm ${
                  m.role === "user"
                    ? "gradient-primary text-primary-foreground rounded-tr-sm"
                    : "glass text-foreground rounded-tl-sm"
                }`}
              >
                {m.content}
              </div>
              {m.perfumes && m.perfumes.length > 0 && (
                <div className="space-y-2">
                  {m.perfumes.map((p) => (
                    <PerfumeCard key={p.id} perfume={p} variant="compact" />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Aroma está pensando...
            </div>
          </div>
        )}

        {messages.length === 1 && !loading && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="glass text-left text-xs p-3 rounded-2xl hover:bg-white/5 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-24 inset-x-0 px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="glass max-w-md mx-auto flex items-center gap-2 rounded-2xl p-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Conte sua vibe..."
            disabled={loading}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow disabled:opacity-40"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
