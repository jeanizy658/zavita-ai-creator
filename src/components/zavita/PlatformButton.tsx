import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlatformButton({
  icon: Icon,
  label,
  tint,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  tint: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "surface-card flex flex-col items-center gap-2 px-2 py-3 transition-all duration-200 hover:border-border-strong active:scale-[0.95]",
        active && "border-accent shadow-glow-sm",
      )}
    >
      <span
        className="flex size-10 items-center justify-center rounded-full border border-border-strong"
        style={{ backgroundColor: `color-mix(in oklab, ${tint} 22%, transparent)` }}
      >
        <Icon className="size-[18px]" strokeWidth={1.6} style={{ color: tint }} />
      </span>
      <span
        className={cn(
          "text-[11px] font-medium",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}
