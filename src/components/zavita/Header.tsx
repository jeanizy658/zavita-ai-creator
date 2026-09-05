import { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

const NOTIFICATIONS = [
  { id: "n1", title: "Export ready", body: "Business Tips • 4K 60fps is ready to publish.", time: "2 min" },
  { id: "n2", title: "AI Avatar generated", body: "Your presenter avatar is available in the editor.", time: "1 h" },
  { id: "n3", title: "Post scheduled", body: "Travel Vlog will publish tonight at 7:30 PM.", time: "Yesterday" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState<string[]>([]);
  const unread = NOTIFICATIONS.filter((n) => !read.includes(n.id)).length;

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
          onClick={() => setOpen((v) => !v)}
          aria-label="Notifications"
          aria-expanded={open}
          className="relative flex size-9 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-2 active:scale-95"
        >
          <Bell className="size-[18px] text-muted-foreground" strokeWidth={1.6} />
          {unread > 0 ? (
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-accent shadow-glow-sm" />
          ) : null}
        </button>
        <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] text-gold">
          PRO
        </span>
      </div>

      {open ? (
        <>
        <button
          aria-label="Close notifications overlay"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 cursor-default"
        />
        <div className="animate-rise absolute right-4 top-[64px] z-40 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-glow-sm">
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Notifications
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRead(NOTIFICATIONS.map((n) => n.id))}
                className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[9.5px] font-bold uppercase tracking-[0.1em] text-accent active:scale-95"
              >
                <Check className="size-3" strokeWidth={2.4} /> Read all
              </button>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground active:scale-95"
              >
                <X className="size-3" strokeWidth={2.2} />
              </button>
            </div>
          </div>
          <ul>
            {NOTIFICATIONS.map((n) => {
              const isRead = read.includes(n.id);
              return (
                <li key={n.id}>
                  <button
                    onClick={() => setRead((r) => (r.includes(n.id) ? r : [...r, n.id]))}
                    className="flex w-full items-start gap-2.5 border-b border-border px-3.5 py-3 text-left last:border-0 active:bg-surface-2"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-1.5 shrink-0 rounded-full",
                        isRead ? "bg-border-strong" : "bg-accent shadow-glow-sm",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-[12.5px] font-semibold text-foreground">
                          {n.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{n.time}</span>
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                        {n.body}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        </>
      ) : null}
    </header>
  );
}
