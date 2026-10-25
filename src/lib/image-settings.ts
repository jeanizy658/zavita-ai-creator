import { z } from "zod";

export const IMAGE_STYLES = ["Realistic Photography", "Cinematic", "Anime", "3D Render", "Illustration", "Digital Art", "Minimalist", "Product Photography", "Portrait", "Fantasy"] as const;
export const IMAGE_RATIOS = ["1:1", "16:9", "9:16", "4:3"] as const;
export const imageInput = z.object({
  prompt: z.string().trim().min(1, "Enter an image prompt.").max(4000),
  style: z.enum(IMAGE_STYLES),
  ratio: z.enum(IMAGE_RATIOS),
});
export function styledPrompt(prompt: string, style: string) {
  return `${prompt.trim()}\n\nVisual style: ${style}. Apply this style consistently to lighting, composition, materials and rendering.`;
}