/** Shared, provider-agnostic description of the AI capabilities ZAVITA exposes. */
export const AI_CAPABILITIES = [
  "generateImage",
  "generateVideo",
  "enhanceVideo",
  "enhanceVoice",
  "removeBackground",
  "generateAvatar",
  "generateCaptions",
  "analyzeContent",
  "generateBrollSuggestions",
  "generateIllustrationSuggestions",
  "generateTextSuggestions",
  "generateSoundDesign",
] as const;

export type AiCapability = (typeof AI_CAPABILITIES)[number];

/** Feature-flag name owning each capability. Flags are read server-side only. */
export const CAPABILITY_FLAG: Record<AiCapability, string> = {
  generateImage: "AI_IMAGE_ENABLED",
  generateVideo: "AI_VIDEO_ENABLED",
  enhanceVideo: "AI_ENHANCE_ENABLED",
  enhanceVoice: "AI_VOICE_ENABLED",
  removeBackground: "AI_BACKGROUND_ENABLED",
  generateAvatar: "AI_AVATAR_ENABLED",
  generateCaptions: "AI_CAPTIONS_ENABLED",
  analyzeContent: "AI_TEXT_ENABLED",
  generateBrollSuggestions: "AI_TEXT_ENABLED",
  generateIllustrationSuggestions: "AI_TEXT_ENABLED",
  generateTextSuggestions: "AI_TEXT_ENABLED",
  generateSoundDesign: "AI_SOUND_ENABLED",
};

export type AiResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: "NOT_CONFIGURED" | "DISABLED" | "PROVIDER_ERROR" | "INVALID_INPUT"; message: string };

export class AiNotConfiguredError extends Error {}
