import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type TrackId = "main" | "overlay" | "photo" | "text" | "ai" | "audio";

export type TimelineMedia = {
  id: string;
  trackId: TrackId;
  label: string;
  image?: string | undefined;
  duration: number;
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
  const [timelineMedia, setTimelineMedia] = useState<TimelineMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);

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
      projectName: "Business Tips",
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
