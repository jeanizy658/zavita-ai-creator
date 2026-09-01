import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function ModuleHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-xl">
      <Link
        to="/editor"
        aria-label="Back to editor"
        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface active:scale-95"
      >
        <ChevronLeft className="size-5" strokeWidth={1.7} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold">{title}</p>
        {subtitle ? (
          <p className="truncate text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      <Link
        to="/home"
        className="shrink-0 rounded-full border border-border bg-surface px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground active:scale-95"
      >
        Home
      </Link>
    </header>
  );
}
