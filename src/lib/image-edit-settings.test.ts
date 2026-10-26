import { describe, expect, it } from "vitest";
import { buildEditPrompt, editConflict, toggleOption } from "./image-edit-settings";

const base = { options: [], instructions: "", preserve: true, zone: "auto" as const };

describe("image edit rules", () => {
  it("allows only one hairstyle at a time", () => {
    expect(toggleOption(["hairLong", "glasses"], "hairShort")).toEqual(["glasses", "hairShort"]);
  });
  it("allows only one skin tone at a time", () => {
    expect(toggleOption(["skinBlack"], "skinLight")).toEqual(["skinLight"]);
  });
  it("lets accessories combine", () => {
    expect(toggleOption(["glasses"], "necklace")).toEqual(["glasses", "necklace"]);
  });
  it("requires at least one change", () => {
    expect(editConflict(base)).not.toBeNull();
  });
  it("rejects dress with trousers", () => {
    expect(editConflict({ ...base, options: ["dress", "trousers"] })).toContain("Robe");
  });
  it("keeps user text verbatim and never changes skin tone implicitly", () => {
    const p = buildEditPrompt({ ...base, options: ["glasses"], instructions: "Ajoute des lunettes noires élégantes." });
    expect(p).toContain("Ajoute des lunettes noires élégantes.");
    expect(p).toContain("Do not change the skin tone.");
  });
});
