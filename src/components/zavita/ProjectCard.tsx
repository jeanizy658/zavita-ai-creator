import { Play } from "lucide-react";

export function ProjectCard({
  thumbnail,
  title,
  duration,
  date,
}: {
  thumbnail: string;
  title: string;
  duration: string;
  date: string;
}) {
  return (
    <button className="group w-[148px] shrink-0 text-left transition-transform duration-200 active:scale-[0.97]">
      <div className="relative aspect-[9/13] overflow-hidden rounded-xl border border-border">
        <img
          src={thumbnail}
          alt={title}
          loading="lazy"
          width={512}
          height={768}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
        <span className="absolute right-2 top-2 rounded-md bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground backdrop-blur-sm">
          {duration}
        </span>
        <span className="absolute bottom-2 left-2 flex size-7 items-center justify-center rounded-full bg-gradient-brand shadow-glow-sm">
          <Play className="size-3 fill-current text-primary-foreground" strokeWidth={0} />
        </span>
      </div>
      <p className="mt-2 truncate text-[13px] font-semibold text-foreground">{title}</p>
      <p className="text-[11px] text-muted-foreground">{date}</p>
    </button>
  );
}
