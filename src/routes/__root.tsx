import { Outlet, createRootRoute, HeadContent, Scripts, Link } from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthListener } from "@/components/AuthListener";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass rounded-3xl p-8 max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta fragrância não existe no nosso catálogo.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-2xl gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "PerfumeAI — Descubra o seu perfume ideal" },
      {
        name: "description",
        content:
          "PerfumeAI usa inteligência artificial para recomendar perfumes que combinam com você a partir das suas notas olfativas favoritas.",
      },
      { name: "theme-color", content: "#030712" },
      { property: "og:title", content: "PerfumeAI — Descubra o seu perfume ideal" },
      { property: "og:description", content: "Recomendações de perfumes com IA, baseadas nas suas notas favoritas." },
      { property: "og:type", content: "website" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <AuthListener />
      <Outlet />
      <Toaster />
    </>
  );
}
