import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, Plus, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/projects", label: "Projects", icon: LayoutGrid },
  { to: "/avatar", label: "Avatar", icon: Sparkles },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNavigation() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const item = (index: number) => {
    const { to, label, icon: Icon } = items[index]!;
    const active = pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          "flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Icon
          className={cn("size-[21px] transition-transform", active && "scale-110 text-accent")}
          strokeWidth={1.6}
        />
        {label}
      </Link>
    );
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[520px] border-t border-border bg-background/90 px-5 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 backdrop-blur-xl">
      <div className="grid grid-cols-5 items-end">
        {item(0)}
        {item(1)}
        <div className="flex justify-center">
          <Link
            to="/camera"
            aria-label="Create"
            className="-mt-7 flex size-14 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow transition-transform duration-200 hover:brightness-110 active:scale-95"
          >
            <Plus className="size-7 text-primary-foreground" strokeWidth={2.2} />
          </Link>
        </div>
        {item(2)}
        {item(3)}
      </div>
    </nav>
  );
}
