import type { ReactNode } from "react";
import { BottomNavigation } from "./BottomNavigation";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklab,var(--brand-violet)_28%,transparent),transparent_70%)]" />
      <div className="relative mx-auto w-full max-w-[520px] px-5 pb-32 pt-2">{children}</div>
      <BottomNavigation />
    </div>
  );
}
