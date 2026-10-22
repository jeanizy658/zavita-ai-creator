import { describe, expect, test } from "vitest";
import { appendPositions, assetDuration, recordingMime, trackForAsset } from "./media-workflow";

describe("real media workflow rules", () => {
  test("video uses main video", () => expect(trackForAsset("VIDEO")).toBe("main"));
  test("photo uses photo", () => expect(trackForAsset("PHOTO")).toBe("photo"));
  test("image context uses overlay", () => expect(trackForAsset("IMAGE")).toBe("overlay"));
  test("audio, music and voice use audio", () => {
    for (const type of ["AUDIO", "MUSIC", "VOICE"]) expect(trackForAsset(type)).toBe("audio");
  });
  test("AI visual and graphic preserve visual track", () => {
    for (const type of ["AI_VISUAL", "GRAPHIC"]) expect(trackForAsset(type)).toBe("ai");
  });
  test("real short duration is not extended or rounded", () => expect(assetDuration("VIDEO", 0.72)).toBe(0.72));
  test("unreadable video is not given fabricated duration", () => expect(() => assetDuration("VIDEO", null)).toThrow());
  test("append preserves existing clips and independent track ends", () => {
    const existing = [{ track_type: "MAIN", end_time: 12.5, position: 2 }, { track_type: "AUDIO", end_time: 4, position: 0 }];
    expect(appendPositions(existing, [{ track: "MAIN", duration: 2 }, { track: "AUDIO", duration: 3 }, { track: "MAIN", duration: 1 }])).toEqual([
      { start_time: 12.5, end_time: 14.5, position: 3 }, { start_time: 4, end_time: 7, position: 1 }, { start_time: 14.5, end_time: 15.5, position: 4 },
    ]);
    expect(existing[0]?.end_time).toBe(12.5);
  });
  test("recording chooses only a browser-supported format", () => {
    expect(recordingMime((mime) => mime === "video/mp4")).toBe("video/mp4");
    expect(recordingMime(() => false)).toBeUndefined();
  });
});