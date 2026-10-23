import { createContext, useContext, useMemo, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

import { useAuth } from "@/lib/auth";
import { createProject, getProject, listClips, type Asset } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import { signedUrl } from "@/lib/storage";

export type TrackId = "main" | "overlay" | "photo" | "text" | "ai" | "audio";

export type TimelineMedia = {
  id: string;
  trackId: TrackId;
  label: string;
  image?: string | undefined;
  duration: number;
  start?: number;
  assetId?: string | undefined;
  source?: string | undefined;
  assetType?: string | undefined;
  visible?: boolean;
};

export type EnhanceMode = "Natural" | "Balanced" | "Pro";
export type BackgroundMode = "ORIGINAL" | "BLUR" | "REPLACE";
export type BlurStrength = "LIGHT" | "MEDIUM" | "STRONG" | "CINEMATIC";
export type AvatarStyle = "REALISTIC" | "BUSINESS" | "CREATOR" | "PRESENTER";
export type AvatarStatus = "idle" | "generating" | "completed";

export type ExportFormat = "9:16" | "1:1" | "16:9";
export type ExportQuality = "1080p" | "4K";
export type ExportFps = 30 | 60;
export type TaskStatus = "idle" | "processing" | "completed";
export type PlatformId = "youtube" | "facebook" | "instagram" | "tiktok";
export type PublishMode = "NOW" | "SCHEDULE";
export type PublishStatus = "idle" | "processing" | "published" | "scheduled";

type VoiceValues = {
  noise: number;
  echo: number;
  clarity: number;
  volume: number;
};

type StudioValue = {
  projectName: string;
  projectId: string | null;
  projectLoading: boolean;
  projectError: string | null;
  openProject: (id: string) => Promise<void>;
  ensureProject: () => Promise<string>;
  refreshProject: () => Promise<void>;

  timelineMedia: TimelineMedia[];
  addToTimeline: (items: Omit<TimelineMedia, "id">[]) => void;
  selectedMedia: string[];
  setSelectedMedia: (ids: string[]) => void;

  enhanceMode: EnhanceMode;
  setEnhanceMode: (m: EnhanceMode) => void;
  enhanceIntensity: number;
  setEnhanceIntensity: (n: number) => void;

  backgroundMode: BackgroundMode;
  setBackgroundMode: (m: BackgroundMode) => void;
  blurStrength: BlurStrength;
  setBlurStrength: (b: BlurStrength) => void;
  selectedBackground: string | null;
  setSelectedBackground: (id: string | null) => void;
  backgroundPrompt: string;
  setBackgroundPrompt: (v: string) => void;

  voice: VoiceValues;
  setVoice: (key: keyof VoiceValues, value: number) => void;
  voiceProfile: string;
  setVoiceProfile: (v: string) => void;

  avatarStyle: AvatarStyle;
  setAvatarStyle: (v: AvatarStyle) => void;
  avatarScript: string;
  setAvatarScript: (v: string) => void;
  avatarVoice: string;
  setAvatarVoice: (v: string) => void;
  avatarStatus: AvatarStatus;
  setAvatarStatus: (v: AvatarStatus) => void;

  exportFormat: ExportFormat;
  setExportFormat: (v: ExportFormat) => void;
  exportQuality: ExportQuality;
  setExportQuality: (v: ExportQuality) => void;
  exportFps: ExportFps;
  setExportFps: (v: ExportFps) => void;
  exportStatus: TaskStatus;
  setExportStatus: (v: TaskStatus) => void;

  platforms: Record<PlatformId, boolean>;
  togglePlatform: (id: PlatformId) => void;
  caption: string;
  setCaption: (v: string) => void;
  hashtags: string[];
  addHashtag: (v: string) => void;
  removeHashtag: (v: string) => void;
  publishMode: PublishMode;
  setPublishMode: (v: PublishMode) => void;
  scheduledDate: string;
  setScheduledDate: (v: string) => void;
  scheduledTime: { hour: number; minute: number; meridiem: "AM" | "PM" };
  setScheduledTime: (v: { hour: number; minute: number; meridiem: "AM" | "PM" }) => void;
  publishStatus: PublishStatus;
  setPublishStatus: (v: PublishStatus) => void;
};

const StudioContext = createContext<StudioValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("New project");
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const request = useRef(0);
  const ensurePending = useRef<Promise<string> | null>(null);
  const [timelineMedia, setTimelineMedia] = useState<TimelineMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

  const openProject = useCallback(async (id: string) => {
    if (!user) throw new Error("Sign in to open a saved project.");
    const ticket = ++request.current;
    setProjectLoading(true); setProjectError(null);
    try {
      const project = await getProject(id);
      if (!project || project.user_id !== user.id) throw new Error("This project is not available to your account.");
      const clips = await listClips(id);
      const assetIds = [...new Set(clips.flatMap((c) => c.asset_id ? [c.asset_id] : []))];
      let assets: Asset[] = [];
      if (assetIds.length) {
        const { data, error } = await supabase.from("assets").select("*").in("id", assetIds);
        if (error) throw new Error(error.message);
        assets = data ?? [];
      }
      const hydrated = await Promise.all(clips.map(async (clip) => {
        const asset = assets.find((a) => a.id === clip.asset_id);
        const image = await signedUrl(asset?.thumbnail_url);
        const source = await signedUrl(asset?.storage_path ?? asset?.file_url);
        return { id: clip.id, trackId: ({ MAIN: "main", OVERLAY: "overlay", PHOTO: "photo", TEXT: "text", AI_VISUAL: "ai", AUDIO: "audio" } as const)[clip.track_type],
          label: clip.label ?? asset?.name ?? "Media", duration: Number(clip.duration), start: Number(clip.start_time),
          assetId: asset?.id, assetType: asset?.type, image: image ?? undefined, source: source ?? undefined, visible: clip.visible };
      }));
      if (ticket !== request.current) return;
      setProjectId(project.id); setProjectName(project.title); setTimelineMedia(hydrated);
      localStorage.setItem(`zavita-project-${user.id}`, project.id);
    } catch (e) {
      if (ticket === request.current) { setProjectId(null); setProjectError(e instanceof Error ? e.message : "Could not restore project."); }
      throw e;
    } finally { if (ticket === request.current) setProjectLoading(false); }
  }, [user?.id]);
  const ensureProject = useCallback(async () => {
    if (!user) throw new Error("Sign in to save your media.");
    if (projectId) return projectId;
    if (ensurePending.current) return ensurePending.current;
    const pending = (async () => {
      const stored = localStorage.getItem(`zavita-project-${user.id}`);
      if (stored) { await openProject(stored); return stored; }
      const project = await createProject(user.id);
      await openProject(project.id); return project.id;
    })();
    ensurePending.current = pending;
    try { return await pending; } finally { ensurePending.current = null; }
  }, [user?.id, projectId, openProject]);
  const refreshProject = useCallback(async () => {
    const id = projectId ?? (user ? localStorage.getItem(`zavita-project-${user.id}`) : null);
    if (id) await openProject(id);
  }, [user?.id, projectId, openProject]);
  useEffect(() => {
    request.current++; ensurePending.current = null;
    setProjectId(null); setProjectName("New project"); setTimelineMedia([]); setSelectedMedia([]); setProjectError(null); setProjectLoading(false);
    if (!user) return;
    const stored = localStorage.getItem(`zavita-project-${user.id}`);
    if (stored) void openProject(stored).catch(() => {});
  }, [user?.id, openProject]);

  const [enhanceMode, setEnhanceMode] = useState<EnhanceMode>("Balanced");
  const [enhanceIntensity, setEnhanceIntensity] = useState(50);

  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("BLUR");
  const [blurStrength, setBlurStrength] = useState<BlurStrength>("MEDIUM");
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const [backgroundPrompt, setBackgroundPrompt] = useState("Modern luxury office");

  const [voice, setVoiceState] = useState<VoiceValues>({
    noise: 80,
    echo: 70,
    clarity: 85,
    volume: 90,
  });
  const [voiceProfile, setVoiceProfile] = useState("Natural Voice");

  const [avatarStyle, setAvatarStyle] = useState<AvatarStyle>("REALISTIC");
  const [avatarScript, setAvatarScript] = useState("Bonjour et bienvenue sur ma chaîne.");
  const [avatarVoice, setAvatarVoice] = useState("Natural Voice");
  const [avatarStatus, setAvatarStatus] = useState<AvatarStatus>("idle");

  const [exportFormat, setExportFormat] = useState<ExportFormat>("9:16");
  const [exportQuality, setExportQuality] = useState<ExportQuality>("4K");
  const [exportFps, setExportFps] = useState<ExportFps>(60);
  const [exportStatus, setExportStatus] = useState<TaskStatus>("idle");
  const [platforms, setPlatforms] = useState<Record<PlatformId, boolean>>({
    youtube: true,
    facebook: true,
    instagram: true,
    tiktok: true,
  });
  const [caption, setCaption] = useState("5 conseils pour réussir son business");
  const [hashtags, setHashtags] = useState<string[]>(["#Business", "#Entrepreneur", "#Success"]);
  const [publishMode, setPublishMode] = useState<PublishMode>("SCHEDULE");
  const [scheduledDate, setScheduledDate] = useState("2024-06-05");
  const [scheduledTime, setScheduledTime] = useState<{
    hour: number;
    minute: number;
    meridiem: "AM" | "PM";
  }>({ hour: 7, minute: 30, meridiem: "PM" });
  const [publishStatus, setPublishStatus] = useState<PublishStatus>("idle");

  const value = useMemo<StudioValue>(
    () => ({
      projectName, projectId, projectLoading, projectError, openProject, ensureProject, refreshProject,
      timelineMedia,
      addToTimeline: (items) =>
        setTimelineMedia((prev) => [
          ...prev,
          ...items.map((i, idx) => ({ ...i, id: `tm-${Date.now()}-${idx}` })),
        ]),
      selectedMedia,
      setSelectedMedia,
      enhanceMode,
      setEnhanceMode,
      enhanceIntensity,
      setEnhanceIntensity,
      backgroundMode,
      setBackgroundMode,
      blurStrength,
      setBlurStrength,
      selectedBackground,
      setSelectedBackground,
      backgroundPrompt,
      setBackgroundPrompt,
      voice,
      setVoice: (key, v) => setVoiceState((prev) => ({ ...prev, [key]: v })),
      voiceProfile,
      setVoiceProfile,
      avatarStyle,
      setAvatarStyle,
      avatarScript,
      setAvatarScript,
      avatarVoice,
      setAvatarVoice,
      avatarStatus,
      setAvatarStatus,
      exportFormat,
      setExportFormat,
      exportQuality,
      setExportQuality,
      exportFps,
      setExportFps,
      exportStatus,
      setExportStatus,
      platforms,
      togglePlatform: (id) => setPlatforms((prev) => ({ ...prev, [id]: !prev[id] })),
      caption,
      setCaption,
      hashtags,
      addHashtag: (v) =>
        setHashtags((prev) => {
          const tag = `#${v.replace(/^#+/, "").trim()}`;
          if (tag.length < 2 || prev.some((t) => t.toLowerCase() === tag.toLowerCase())) return prev;
          return [...prev, tag];
        }),
      removeHashtag: (v) => setHashtags((prev) => prev.filter((t) => t !== v)),
      publishMode,
      setPublishMode,
      scheduledDate,
      setScheduledDate,
      scheduledTime,
      setScheduledTime,
      publishStatus,
      setPublishStatus,
    }),
    [
      projectName, projectId, projectLoading, projectError, openProject, ensureProject, refreshProject,
      timelineMedia,
      selectedMedia,
      enhanceMode,
      enhanceIntensity,
      backgroundMode,
      blurStrength,
      selectedBackground,
      backgroundPrompt,
      voice,
      voiceProfile,
      avatarStyle,
      avatarScript,
      avatarVoice,
      avatarStatus,
      exportFormat,
      exportQuality,
      exportFps,
      exportStatus,
      platforms,
      caption,
      hashtags,
      publishMode,
      scheduledDate,
      scheduledTime,
      publishStatus,
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}
