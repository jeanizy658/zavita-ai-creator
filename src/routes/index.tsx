import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Logo } from "@/components/zavita/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZAVITA — Everything is Done" },
      {
        name: "description",
        content: "ZAVITA is an AI content creation studio: record, enhance, edit and publish everywhere.",
      },
      { property: "og:title", content: "ZAVITA — Everything is Done" },
      {
        property: "og:description",
        content: "Create once. Let AI do the rest. The premium mobile AI content studio.",
      },
    ],
  }),
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/home", replace: true }), 2200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_38%,color-mix(in_oklab,var(--brand-violet)_34%,transparent),transparent_70%)]" />
      <div className="animate-rise relative flex flex-col items-center">
        <Logo size={124} />
        <h1 className="mt-7 font-display text-[34px] font-extrabold tracking-[0.3em] text-foreground">
          ZAVITA
        </h1>
        <p className="mt-2 text-[12px] tracking-[0.34em] text-gradient font-semibold">
          EVERYTHING IS DONE
        </p>
      </div>
      <div className="absolute bottom-24 flex flex-col items-center gap-4">
        <span className="animate-spin-slow block size-9 rounded-full border-2 border-border-strong border-t-primary" />
        <p className="text-[11px] tracking-[0.2em] text-muted-foreground">
          Create once. Let AI do the rest.
        </p>
      </div>
    </div>
  );
}
