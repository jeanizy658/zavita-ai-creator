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
    ],
  );

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within StudioProvider");
  return ctx;
}
