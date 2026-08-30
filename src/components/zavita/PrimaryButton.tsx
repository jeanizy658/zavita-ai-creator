import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gradient" | "ghost";
};

export function PrimaryButton({ variant = "gradient", className, ...props }: Props) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold tracking-wide transition-all duration-200 active:scale-[0.97]",
        variant === "gradient"
          ? "bg-gradient-brand text-primary-foreground shadow-glow-sm hover:brightness-110"
          : "border border-border-strong bg-surface text-foreground hover:bg-surface-2",
        className,
      )}
    />
  );
}
