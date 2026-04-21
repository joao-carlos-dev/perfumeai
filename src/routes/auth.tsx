/** Tela de cadastro/login com email + senha. */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthScreen,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(6, "Mínimo de 6 caracteres").max(72),
  name: z.string().trim().min(1, "Informe um nome").max(80).optional(),
});

function AuthScreen() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Se já está logado, vai para home
  if (user) {
    navigate({ to: "/" });
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      email,
      password,
      name: mode === "signup" ? name : undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: parsed.data.name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Bora descobrir seu perfume.");
        // Cadastro: vai direto para o quiz
        navigate({ to: "/quiz" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Bem-vinda(o) de volta!");
        navigate({ to: "/" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao autenticar";
      toast.error(
        msg.includes("Invalid login credentials") ? "E-mail ou senha incorretos" : msg
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10">
      <div className="glass w-full max-w-sm rounded-3xl p-7 animate-fade-in-up">
        <div className="text-center mb-6">
          <p className="text-xs uppercase tracking-[0.3em] text-accent font-semibold">
            Perfume<span className="text-secondary">AI</span>
          </p>
          <h1 className="mt-2 text-2xl font-bold">
            {mode === "signup" ? "Crie sua conta" : "Entrar"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signup"
              ? "Em 1 minuto você descobre seu perfume ideal"
              : "Sentimos sua falta"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              autoComplete="name"
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            autoComplete="email"
            required
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold shadow-glow disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "signup" ? "Criar conta" : "Entrar"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === "signup" ? "Já tem conta?" : "Novo por aqui?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="text-accent font-semibold"
          >
            {mode === "signup" ? "Entrar" : "Criar conta"}
          </button>
        </p>

        <Link to="/" className="block mt-3 text-center text-xs text-muted-foreground hover:text-foreground">
          Continuar sem conta
        </Link>
      </div>
    </div>
  );
}
