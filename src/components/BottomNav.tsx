/** Barra inferior de navegação — estilo app mobile. */
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, MessageCircle, User } from "lucide-react";

const items = [
  { to: "/" as const, icon: Home, label: "Início" },
  { to: "/quiz" as const, icon: Sparkles, label: "Quiz" },
  { to: "/chat" as const, icon: MessageCircle, label: "Aroma" },
  { to: "/perfil" as const, icon: User, label: "Perfil" },
];

export function BottomNav() {
  const { location } = useRouterState();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 px-4 pb-4 pt-2">
      <div className="glass rounded-3xl mx-auto max-w-md flex items-center justify-around p-2">
        {items.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                active
                  ? "gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
