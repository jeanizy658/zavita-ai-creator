import logo from "@/assets/zavita-logo.png";
import { cn } from "@/lib/utils";

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logo}
      alt="ZAVITA logo"
      width={size}
      height={size}
      className={cn("select-none object-contain drop-shadow-[0_0_18px_rgba(124,58,237,0.45)]", className)}
      style={{ width: size, height: size }}
    />
  );
}
