import type { LucideIcon } from "lucide-react";
import { AppShell } from "./AppShell";
import { Header } from "./Header";

export function PlaceholderScreen({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <AppShell>
      <Header />
      <div className="animate-rise flex min-h-[60vh] flex-col items-center justify-center text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
          <Icon className="size-7 text-primary-foreground" strokeWidth={1.5} />
        </span>
        <h1 className="mt-5 text-2xl font-bold">{title}</h1>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
        <p className="mt-6 rounded-full border border-border bg-surface px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Coming soon
        </p>
      </div>
    </AppShell>
  );
}
