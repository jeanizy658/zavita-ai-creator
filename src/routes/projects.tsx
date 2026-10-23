import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { createProject, listProjects } from "@/lib/data";
import { signedUrl } from "@/lib/storage";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/zavita/AppShell";
import { Header } from "@/components/zavita/Header";
import { ProjectCard } from "@/components/zavita/ProjectCard";
import { SectionHeader } from "@/components/zavita/SectionHeader";
import { useStudio } from "@/lib/studio-store";
import { cn } from "@/lib/utils";
import businessThumb from "@/assets/proj-business.jpg";
import travelThumb from "@/assets/proj-travel.jpg";
import productThumb from "@/assets/proj-product.jpg";
import broll1 from "@/assets/broll-1.jpg";
import broll2 from "@/assets/broll-2.jpg";
import broll3 from "@/assets/broll-3.jpg";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — ZAVITA" },
      { name: "description", content: "All your ZAVITA AI video and photo projects in one place." },
      { property: "og:title", content: "Projects — ZAVITA" },
      { property: "og:description", content: "All your ZAVITA AI projects in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsScreen,
});

type Project = {
  id?: string;
  title: string;
  duration: string;
  date: string;
  thumbnail: string;
  status: "Published" | "Scheduled" | "Draft";
};

const SAMPLE_PROJECTS: Project[] = [
  { title: "Business Tips", duration: "02:15", date: "Today", thumbnail: businessThumb, status: "Draft" },
  { title: "Travel Vlog", duration: "01:28", date: "Yesterday", thumbnail: travelThumb, status: "Scheduled" },
  { title: "Product Review", duration: "00:58", date: "2 days ago", thumbnail: productThumb, status: "Published" },
  { title: "City Skyline", duration: "00:06", date: "Last week", thumbnail: broll1, status: "Published" },
  { title: "Laptop Work", duration: "00:04", date: "Last week", thumbnail: broll2, status: "Draft" },
  { title: "Team Meeting", duration: "00:08", date: "Last month", thumbnail: broll3, status: "Published" },
];

const FILTERS = ["All", "Draft", "Scheduled", "Published"] as const;

function ProjectsScreen() {
  const navigate = useNavigate();
  const { openProject } = useStudio();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const [real, setReal] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return setReal(null);
    listProjects()
      .then(async (rows) =>
        setReal(
          await Promise.all(
            rows.map(async (r) => ({
              id: r.id,
              title: r.title,
              duration: `${String(Math.floor(Number(r.duration) / 60)).padStart(2, "0")}:${String(Math.round(Number(r.duration)) % 60).padStart(2, "0")}`,
              date: new Date(r.updated_at).toLocaleDateString(),
              thumbnail: (await signedUrl(r.thumbnail_url)) ?? businessThumb,
              status: (r.status === "PUBLISHED" ? "Published" : r.status === "SCHEDULED" ? "Scheduled" : "Draft") as Project["status"],
            })),
          ),
        ),
      )
      .catch((e: Error) => setError(e.message));
  }, [user]);

  const newProject = async () => {
    if (!user) return navigate({ to: "/auth" });
    try {
      const project = await createProject(user.id, `Project ${new Date().toLocaleDateString()}`);
      await openProject(project.id);
    } catch (e) {
      return setError(e instanceof Error ? e.message : "Could not create project.");
    }
    navigate({ to: "/camera" });
  };

  const PROJECTS = user ? real ?? [] : SAMPLE_PROJECTS;
  const list = PROJECTS.filter(
    (p) =>
      (filter === "All" || p.status === filter) &&
      p.title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <AppShell>
      <Header />

      <section className="animate-rise">
        <SectionHeader
          title="My Projects"
          actionLabel="New"
          onAction={() => void newProject()}
        />

        <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5">
          <Search className="size-4 text-muted-foreground" strokeWidth={1.7} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a project"
            className="w-full bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>

        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] transition-all active:scale-95",
                filter === f
                  ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow-sm"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {error ? <p className="mt-3 text-[11px] text-destructive">{error}</p> : null}
      {!user ? (
        <p className="mt-3 text-[11px] text-muted-foreground">Showing samples. <a href="/auth" className="text-accent">Sign in</a> to see your saved projects.</p>
      ) : null}
      <section className="animate-rise mt-5">
        {list.length === 0 ? (
          <div className="surface-card flex flex-col items-center gap-3 px-5 py-10 text-center">
            <p className="text-[13px] font-semibold">No project found</p>
            <p className="text-[11.5px] text-muted-foreground">
              Try another search or record a new video.
            </p>
            <button
              onClick={() => navigate({ to: "/camera" })}
              className="rounded-xl bg-gradient-brand px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-glow-sm active:scale-95"
            >
              Record now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {list.map((p) => (
              <div key={p.title + p.date} className="relative">
                <ProjectCard
                  thumbnail={p.thumbnail}
                  title={p.title}
                  duration={p.duration}
                  date={p.date}
                  className="group w-full text-left transition-transform duration-200 active:scale-[0.97]"
                  onClick={() => { if (!p.id) { navigate({ to: "/editor" }); return; } void openProject(p.id).then(() => navigate({ to: "/editor" })).catch((e) => setError(e.message)); }}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] backdrop-blur-sm",
                    p.status === "Published"
                      ? "bg-[oklch(0.8_0.2_150)]/20 text-[oklch(0.85_0.2_150)]"
                      : p.status === "Scheduled"
                        ? "bg-accent/20 text-accent"
                        : "bg-background/70 text-muted-foreground",
                  )}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <button
        onClick={() => void newProject()}
        className="animate-rise mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3.5 text-[11.5px] font-extrabold uppercase tracking-[0.16em] text-primary-foreground shadow-glow-sm active:scale-[0.98]"
      >
        <Plus className="size-4" strokeWidth={2.4} /> New project
      </button>
    </AppShell>
  );
}
