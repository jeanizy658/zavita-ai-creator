import { z } from "zod";

export const EDIT_SOURCE_MIMES = ["image/jpeg", "image/png", "image/webp"] as const;
export const EDIT_SOURCE_MAX_BYTES = 10 * 1024 * 1024;

export const EDIT_OPTIONS = {
  glasses: { label: "Lunettes", category: "accessories", instruction: "Add natural-looking eyeglasses to the subject's face, matching head angle, perspective, scale, shadows and lighting." },
  sunglasses: { label: "Lunettes de soleil", category: "accessories", instruction: "Add sunglasses to the subject's face, matching head angle, perspective, scale, reflections, shadows and lighting." },
  bracelet: { label: "Bracelet", category: "accessories", instruction: "Add a bracelet on a visible wrist only. If no wrist is visible, do not invent one and leave the image unchanged in that area." },
  necklace: { label: "Collier", category: "accessories", instruction: "Add a necklace around the neck only if the neck area is visible, following its curve with realistic shadows." },
  menswear: { label: "Vêtement homme", category: "clothing", instruction: "Change the subject's outfit to menswear fitted to the original body, pose and perspective." },
  womenswear: { label: "Vêtement femme", category: "clothing", instruction: "Change the subject's outfit to womenswear fitted to the original body, pose and perspective." },
  trousers: { label: "Pantalon", category: "clothing", instruction: "Dress the subject in trousers fitted to the original legs and pose." },
  dress: { label: "Robe", category: "clothing", instruction: "Dress the subject in a dress fitted to the original body and pose." },
  shoes: { label: "Chaussures", category: "clothing", instruction: "Change the visible shoes, keeping the feet position and ground contact shadows." },
  hairLong: { label: "Cheveux longs", category: "hair", instruction: "Change the hairstyle to long hair." },
  hairShort: { label: "Cheveux courts", category: "hair", instruction: "Change the hairstyle to short hair." },
  hairWavy: { label: "Cheveux bouclés", category: "hair", instruction: "Change the hairstyle to wavy, curly hair." },
  hairCoily: { label: "Cheveux frisés", category: "hair", instruction: "Change the hairstyle to tightly coiled, frizzy hair." },
  skinBlack: { label: "Noir", category: "skin", instruction: "Change the visible skin tone to a deep Black skin tone, consistently across face, neck, arms and every visible skin area." },
  skinLight: { label: "Clair", category: "skin", instruction: "Change the visible skin tone to a light skin tone, consistently across face, neck, arms and every visible skin area." },
  skinDark: { label: "Foncé", category: "skin", instruction: "Change the visible skin tone to a darker skin tone, consistently across face, neck, arms and every visible skin area." },
  mannequin: { label: "Mannequin de boutique", category: "commerce", instruction: "Present the clothing or product on a retail store mannequin for an e-commerce / advertising shot; replacing the person with a mannequin is explicitly requested." },
  inStore: { label: "Dans une boutique", category: "commerce", instruction: "Replace only the background with a coherent store matching the product (fashion boutique for clothes, shoe store for shoes, jewelry store for jewelry), keeping the subject and product intact." },
  car: { label: "Voiture", category: "vehicle", instruction: "Add a car to the scene where the composition allows it, without hiding the main subject; adjust perspective, scale, shadows and lighting." },
} as const;

export type EditOptionId = keyof typeof EDIT_OPTIONS;
export type EditCategory = (typeof EDIT_OPTIONS)[EditOptionId]["category"];

export const EDIT_CATEGORIES: { id: EditCategory; label: string; single: boolean }[] = [
  { id: "accessories", label: "Accessoires", single: false },
  { id: "clothing", label: "Vêtements", single: false },
  { id: "hair", label: "Coiffure", single: true },
  { id: "skin", label: "Teint de peau", single: true },
  { id: "commerce", label: "Scène commerciale", single: false },
  { id: "vehicle", label: "Véhicule", single: false },
];

export const EDIT_ZONES = {
  auto: { label: "Automatique", instruction: "" },
  face: { label: "Visage et lunettes", instruction: "Restrict changes to the face/eyewear area." },
  hair: { label: "Cheveux", instruction: "Restrict changes to the hair." },
  clothes: { label: "Vêtements", instruction: "Restrict changes to the clothing." },
  wrists: { label: "Poignets et accessoires", instruction: "Restrict changes to the wrists and accessories." },
  neck: { label: "Cou et collier", instruction: "Restrict changes to the neck area." },
  background: { label: "Arrière-plan", instruction: "Restrict changes to the background; keep the subject untouched." },
} as const;
export type EditZone = keyof typeof EDIT_ZONES;

const ids = Object.keys(EDIT_OPTIONS) as [EditOptionId, ...EditOptionId[]];
export const editInput = z.object({
  options: z.array(z.enum(ids)).max(19),
  instructions: z.string().trim().max(2000),
  preserve: z.boolean(),
  zone: z.enum(Object.keys(EDIT_ZONES) as [EditZone, ...EditZone[]]),
});
export type EditInput = z.infer<typeof editInput>;

/** Toggle an option; single-choice categories replace the previous choice. */
export function toggleOption(selected: EditOptionId[], id: EditOptionId): EditOptionId[] {
  if (selected.includes(id)) return selected.filter((s) => s !== id);
  const cat = EDIT_CATEGORIES.find((c) => c.id === EDIT_OPTIONS[id].category);
  const kept = cat?.single ? selected.filter((s) => EDIT_OPTIONS[s].category !== cat.id) : selected;
  return [...kept, id];
}

/** Returns a French message for contradictory or empty requests, else null. */
export function editConflict(input: EditInput): string | null {
  const o = new Set(input.options);
  if (o.size === 0 && !input.instructions) return "Sélectionnez au moins une modification ou écrivez une instruction.";
  if (o.has("menswear") && o.has("womenswear")) return "Choisissez soit « Vêtement homme », soit « Vêtement femme ».";
  if (o.has("dress") && o.has("trousers")) return "« Robe » et « Pantalon » se contredisent : précisez la tenue dans les instructions ou n'en gardez qu'un.";
  if (o.has("glasses") && o.has("sunglasses")) return "Choisissez soit « Lunettes », soit « Lunettes de soleil ».";
  if (o.size > 0 && input.zone !== "auto") {
    const zoneFits: Record<Exclude<EditZone, "auto">, EditCategory[]> = { face: ["accessories", "skin"], hair: ["hair"], clothes: ["clothing"], wrists: ["accessories"], neck: ["accessories"], background: ["commerce", "vehicle"] };
    const allowed = zoneFits[input.zone as Exclude<EditZone, "auto">];
    const outside = input.options.filter((id) => !allowed.includes(EDIT_OPTIONS[id].category));
    if (outside.length) return `La zone « ${EDIT_ZONES[input.zone].label} » ne couvre pas : ${outside.map((id) => EDIT_OPTIONS[id].label).join(", ")}.`;
  }
  return null;
}

export function editLabels(options: EditOptionId[]) { return options.map((id) => EDIT_OPTIONS[id].label); }

/** Builds the provider instruction. User text is kept verbatim and takes priority over presets. */
export function buildEditPrompt(input: EditInput): string {
  const lines = ["Edit the provided source image. Do not create an unrelated new image; keep the same scene, framing and photographic style unless a change below requires otherwise."];
  if (input.options.length) lines.push("Requested changes:", ...input.options.map((id) => `- ${EDIT_OPTIONS[id].instruction}`));
  if (input.instructions) lines.push("User instructions (highest priority; if they conflict with the list above, follow these):", input.instructions);
  const zone = EDIT_ZONES[input.zone].instruction;
  if (zone) lines.push(zone);
  if (input.preserve) lines.push("Preserve the subject's face, distinctive features, identity, body proportions, pose and framing as closely as possible. Only change the areas needed for the requested edits; keep unrelated clothing, background and details unchanged.");
  if (!input.options.some((id) => EDIT_OPTIONS[id].category === "skin")) lines.push("Do not change the skin tone.");
  return lines.join("\n");
}
