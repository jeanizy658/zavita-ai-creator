import { ChevronRight } from "lucide-react";

export function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </h2>
      {actionLabel ? (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-accent transition-opacity hover:opacity-80"
        >
          {actionLabel}
          <ChevronRight className="size-3.5" />
        </button>
      ) : null}
    </div>
  );
}
