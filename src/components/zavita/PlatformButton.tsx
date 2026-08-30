import type { LucideIcon } from "lucide-react";

export function PlatformButton({
  icon: Icon,
  label,
  tint,
}: {
  icon: LucideIcon;
  label: string;
  tint: string;
}) {
  return (
    <button className="surface-card flex flex-col items-center gap-2 px-2 py-3 transition-all duration-200 hover:border-border-strong active:scale-[0.95]">
      <span
        className="flex size-10 items-center justify-center rounded-full border border-border-strong"
        style={{ backgroundColor: `color-mix(in oklab, ${tint} 22%, transparent)` }}
      >
        <Icon className="size-[18px]" strokeWidth={1.6} style={{ color: tint }} />
      </span>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </button>
  );
}
