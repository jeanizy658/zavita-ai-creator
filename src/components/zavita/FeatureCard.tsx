import type { LucideIcon } from "lucide-react";

export function FeatureCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="surface-card group relative flex h-full min-h-[122px] flex-col items-start gap-2 overflow-hidden p-4 text-left transition-all duration-200 hover:border-border-strong hover:shadow-glow-sm active:scale-[0.97]"
    >
      <span className="pointer-events-none absolute -right-8 -top-10 size-24 rounded-full bg-gradient-brand opacity-[0.14] blur-2xl transition-opacity duration-300 group-hover:opacity-30" />
      <span className="flex size-9 items-center justify-center rounded-lg border border-border-strong bg-surface-2">
        <Icon className="size-[18px] text-accent" strokeWidth={1.6} />
      </span>
      <span className="mt-1 text-[13px] font-bold uppercase tracking-[0.08em] text-foreground">
        {title}
      </span>
      <span className="text-[11.5px] leading-snug text-muted-foreground">{description}</span>
    </button>
  );
}
