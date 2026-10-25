import { expect, test } from "vitest";
import { imageInput, styledPrompt, IMAGE_RATIOS } from "./image-settings";
test("empty prompts cannot generate", () => expect(imageInput.safeParse({ prompt: "  ", style: "Cinematic", ratio: "1:1" }).success).toBe(false));
test("each requested ratio is accepted", () => {
  for (const ratio of ["1:1", "16:9", "9:16", "4:3"]) expect(imageInput.parse({ prompt: "A flower", style: "Illustration", ratio }).ratio).toBe(ratio);
  expect(IMAGE_RATIOS.length).toBe(4);
});
test("styles affect the provider prompt", () => expect(styledPrompt("A flower", "Cinematic")).not.toBe(styledPrompt("A flower", "Anime")));