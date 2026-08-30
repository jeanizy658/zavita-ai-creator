import { Bell } from "lucide-react";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="sticky top-0 z-30 -mx-5 mb-5 border-b border-border bg-background/85 px-5 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Logo size={38} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[17px] font-bold leading-tight tracking-[0.22em] text-foreground">
            ZAVITA
          </p>
          <p className="truncate text-[10.5px] tracking-[0.14em] text-muted-foreground">
            EVERYTHING IS DONE
          </p>
        </div>
        <button
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-2 active:scale-95"
        >
          <Bell className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent shadow-glow-sm" />
        </button>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-gold">
          PRO
        </span>
      </div>
    </header>
  );
}
