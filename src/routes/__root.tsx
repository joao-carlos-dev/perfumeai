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
      { property: "og:description", content: "PerfumeMatch AI recommends personalized perfumes based on user preferences and scent profiles." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "PerfumeAI — Descubra o seu perfume ideal" },
      { name: "description", content: "PerfumeMatch AI recommends personalized perfumes based on user preferences and scent profiles." },
      { name: "twitter:description", content: "PerfumeMatch AI recommends personalized perfumes based on user preferences and scent profiles." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bb807966-49f4-4281-937d-39a1b8d27cd9/id-preview-efe5d561--d484028e-7674-4a20-9182-13bd11cc162e.lovable.app-1776792022396.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bb807966-49f4-4281-937d-39a1b8d27cd9/id-preview-efe5d561--d484028e-7674-4a20-9182-13bd11cc162e.lovable.app-1776792022396.png" },
      { name: "twitter:card", content: "summary_large_image" },
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
