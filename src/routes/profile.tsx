import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  ChevronRight,
  CircleHelp,
  Crown,
  Download,
  Facebook,
  Instagram,
  LogOut,
  Music2,
  Settings,
  Shield,
  Youtube,
} from "lucide-react";
import { AppShell } from "@/components/zavita/AppShell";
import { Header } from "@/components/zavita/Header";
import { SectionHeader } from "@/components/zavita/SectionHeader";
import { useStudio, type PlatformId } from "@/lib/studio-store";
import { cn } from "@/lib/utils";
import avatarPresenter from "@/assets/avatar-presenter.jpg";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — ZAVITA" },
      { name: "description", content: "Manage your ZAVITA account, PRO plan and creator preferences." },
      { property: "og:title", content: "Profile — ZAVITA" },
      { property: "og:description", content: "Manage your ZAVITA account and PRO plan." },
    ],
  }),
  component: ProfileScreen,
});

const ACCOUNTS: { id: PlatformId; label: string; icon: typeof Youtube; tint: string }[] = [
  { id: "youtube", label: "YouTube", icon: Youtube, tint: "oklch(0.62 0.24 25)" },
  { id: "facebook", label: "Facebook", icon: Facebook, tint: "oklch(0.6 0.19 260)" },
  { id: "instagram", label: "Instagram", icon: Instagram, tint: "oklch(0.66 0.22 350)" },
  { id: "tiktok", label: "TikTok", icon: Music2, tint: "oklch(0.78 0.15 200)" },
];

function Toggle({
  label,
  hint,
  icon: Icon,
  on,
  onToggle,
}: {
  label: string;
  hint: string;
  icon: typeof Bell;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={on}
      className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-0 active:bg-surface-2"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-2">
        <Icon className="size-[17px] text-accent" strokeWidth={1.6} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-foreground">{label}</span>
        <span className="block text-[11px] text-muted-foreground">{hint}</span>
      </span>
      <span
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          on ? "bg-gradient-brand shadow-glow-sm" : "bg-surface-2 border border-border",
        )}
      >
        <span
          className={cn(
            "absolute top-1 size-4 rounded-full bg-foreground transition-all",
            on ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  );
}

function ProfileScreen() {
  const navigate = useNavigate();
  const { platforms, togglePlatform } = useStudio();
  const [prefs, setPrefs] = useState({ notifications: true, hd: true, autosave: false });
  const [toast, setToast] = useState<string | null>(null);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const menu = [
    { label: "Settings", hint: "Language, quality, storage", icon: Settings, action: () => flash("Settings saved for this session") },
    { label: "Privacy & security", hint: "Data and permissions", icon: Shield, action: () => flash("Privacy centre opened") },
    { label: "Help centre", hint: "Guides and support", icon: CircleHelp, action: () => flash("Support will reply within 24 h") },
  ];

  return (
    <AppShell>
      <Header />

      <section className="animate-rise surface-card flex items-center gap-3.5 p-4">
        <img
          src={avatarPresenter}
          alt="Your ZAVITA profile"
          width={128}
          height={128}
          className="size-14 rounded-2xl border border-border-strong object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-foreground">Alex Moreau</p>
          <p className="truncate text-[11.5px] text-muted-foreground">alex@zavita.studio</p>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-gold">
          <Crown className="size-3" strokeWidth={2} /> PRO
        </span>
      </section>

      <section className="animate-rise mt-4 grid grid-cols-3 gap-3">
        {[
          { value: "18", label: "Projects" },
          { value: "42", label: "Exports" },
          { value: "12", label: "Published" },
        ].map((s) => (
          <div key={s.label} className="surface-card px-2 py-3 text-center">
            <p className="text-[18px] font-extrabold text-gradient">{s.value}</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="animate-rise mt-7">
        <SectionHeader title="Connected platforms" />
        <div className="grid grid-cols-2 gap-3">
          {ACCOUNTS.map((a) => {
            const on = platforms[a.id];
            return (
              <button
                key={a.id}
                onClick={() => togglePlatform(a.id)}
                aria-pressed={on}
                className={cn(
                  "surface-card flex items-center gap-2.5 px-3 py-3 text-left transition-all active:scale-[0.97]",
                  on && "border-accent shadow-glow-sm",
                )}
              >
                <a.icon className="size-[18px]" strokeWidth={1.6} style={{ color: a.tint }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-semibold">{a.label}</span>
                  <span
                    className={cn(
                      "block text-[10px] uppercase tracking-[0.1em]",
                      on ? "text-accent" : "text-muted-foreground",
                    )}
                  >
                    {on ? "Connected" : "Disconnected"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="animate-rise mt-7">
        <SectionHeader title="Preferences" />
        <div className="surface-card overflow-hidden p-0">
          <Toggle
            label="Notifications"
            hint="Exports, schedules and AI updates"
            icon={Bell}
            on={prefs.notifications}
            onToggle={() => setPrefs((p) => ({ ...p, notifications: !p.notifications }))}
          />
          <Toggle
            label="High quality exports"
            hint="Always export in 4K when available"
            icon={Download}
            on={prefs.hd}
            onToggle={() => setPrefs((p) => ({ ...p, hd: !p.hd }))}
          />
          <Toggle
            label="Auto-save projects"
            hint="Save every edit automatically"
            icon={Shield}
            on={prefs.autosave}
            onToggle={() => setPrefs((p) => ({ ...p, autosave: !p.autosave }))}
          />
        </div>
      </section>

      <section className="animate-rise mt-7">
        <SectionHeader title="Account" />
        <div className="surface-card overflow-hidden p-0">
          {menu.map((m) => (
            <button
              key={m.label}
              onClick={m.action}
              className="flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-0 active:bg-surface-2"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-surface-2">
                <m.icon className="size-[17px] text-accent" strokeWidth={1.6} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-semibold text-foreground">{m.label}</span>
                <span className="block text-[11px] text-muted-foreground">{m.hint}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
            </button>
          ))}
        </div>
      </section>

      <button
        onClick={() => flash("Upgrade already active — you are PRO")}
        className="animate-rise mt-6 w-full rounded-xl bg-gradient-brand py-3.5 text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-primary-foreground shadow-glow-sm active:scale-[0.98]"
      >
        Manage PRO plan
      </button>

      <button
        onClick={() => {
          flash("Signed out of this session");
          setTimeout(() => navigate({ to: "/home" }), 700);
        }}
        className="animate-rise mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border-strong bg-surface py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground active:scale-[0.98]"
      >
        <LogOut className="size-4" strokeWidth={2} /> Sign out
      </button>

      {toast ? (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit rounded-full border border-border-strong bg-surface px-4 py-2 text-[11.5px] font-semibold text-foreground shadow-glow-sm">
          {toast}
        </div>
      ) : null}
    </AppShell>
  );
}
