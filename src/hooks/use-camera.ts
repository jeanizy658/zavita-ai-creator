import { useCallback, useEffect, useRef, useState } from "react";
import { deviceError, recordingMime } from "@/lib/media-workflow";

type CameraState = "IDLE" | "REQUESTING_PERMISSION" | "READY" | "RECORDING" | "STOPPING" | "PROCESSING" | "RECORDED" | "ERROR";
type CameraCapabilities = MediaTrackCapabilities & { torch?: boolean; zoom?: { min: number; max: number; step: number } };
export type Recording = { file: File; url: string; duration: number; hasAudio: boolean };

export function useCamera() {
  const [state, setState] = useState<CameraState>("IDLE");
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<Recording | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({});
  const [canFlip, setCanFlip] = useState(false);
  const [torch, setTorch] = useState(false);
  const [zoom, setZoom] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const mounted = useRef(true);
  const busy = useRef(false);
  const generation = useRef(0);
  const clipUrl = useRef<string | null>(null);
  const started = useRef(0);
  const clock = useRef<ReturnType<typeof setInterval> | null>(null);

  const release = useCallback(() => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);
  const clearClip = useCallback(() => {
    if (clipUrl.current) URL.revokeObjectURL(clipUrl.current);
    clipUrl.current = null;
    setClip(null);
  }, []);

  const activate = useCallback(async (nextFacing: "user" | "environment" = facing) => {
    if (busy.current) return;
    busy.current = true;
    const request = ++generation.current;
    release();
    setError(null);
    setState("REQUESTING_PERMISSION");
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error(window.isSecureContext ? "This browser cannot access a camera. Import a video instead." : "Camera access requires HTTPS.");
      const acquired = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } }, audio: false,
      });
      if (!mounted.current || request !== generation.current) { acquired.getTracks().forEach((t) => t.stop()); return; }
      stream.current = acquired;
      const track = acquired.getVideoTracks()[0];
      if (!track) throw new Error("No usable camera track was found.");
      const actualFacing = track.getSettings().facingMode;
      setFacing(actualFacing === "environment" ? "environment" : actualFacing === "user" ? "user" : nextFacing);
      const caps = track.getCapabilities?.() as CameraCapabilities | undefined;
      setCapabilities(caps ?? {});
      setTorch(false);
      setZoom(track.getSettings().zoom ?? caps?.zoom?.min ?? 1);
      if (videoRef.current) { videoRef.current.srcObject = acquired; await videoRef.current.play(); }
      setState("READY");
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (mounted.current && request === generation.current) setCanFlip(devices.filter((d) => d.kind === "videoinput").length > 1);
    } catch (e) {
      if (mounted.current && request === generation.current) { release(); setError(deviceError(e)); setState("ERROR"); }
    } finally { busy.current = false; }
  }, [facing, release]);

  const start = async (delay: number, audio: boolean) => {
    if (busy.current || recorder.current?.state === "recording" || state !== "READY") return;
    busy.current = true;
    const request = generation.current;
    setError(null);
    try {
      if (typeof MediaRecorder === "undefined") throw new Error("This browser cannot record video. Import a video instead.");
      const current = stream.current;
      if (!current || !current.getVideoTracks().some((t) => t.readyState === "live")) throw new Error("Camera disconnected. Retry camera access.");
      if (audio && !current.getAudioTracks().length) {
        let mic: MediaStream;
        try { mic = await navigator.mediaDevices.getUserMedia({ video: false, audio: true }); }
        catch (e) { throw new Error(deviceError(e, "Microphone") + " You can turn audio off and retry."); }
        if (!mounted.current || request !== generation.current) { mic.getTracks().forEach((t) => t.stop()); return; }
        mic.getAudioTracks().forEach((t) => current.addTrack(t));
      }
      if (!audio) current.getAudioTracks().forEach((t) => { t.stop(); current.removeTrack(t); });
      for (let remaining = delay; remaining > 0; remaining--) {
        setCountdown(remaining);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (!mounted.current || request !== generation.current) return;
      }
      setCountdown(0);
      const mime = recordingMime((type) => MediaRecorder.isTypeSupported(type));
      const rec = new MediaRecorder(current, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      let failed = false;
      rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
      rec.onerror = () => {
        failed = true;
        if (clock.current) clearInterval(clock.current);
        release();
        if (mounted.current) { setError("Recording failed. Retry or import a video."); setState("ERROR"); }
      };
      rec.onstop = () => {
        if (clock.current) clearInterval(clock.current);
        const duration = (performance.now() - started.current) / 1000;
        const hasAudio = current.getAudioTracks().length > 0;
        release();
        recorder.current = null;
        if (!mounted.current || failed) return;
        setState("PROCESSING");
        const blob = new Blob(chunks, { type: rec.mimeType || chunks[0]?.type || "video/webm" });
        if (!blob.size || duration <= 0) { setError("No video was captured. Please retake."); setState("ERROR"); return; }
        clearClip();
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        const file = new File([blob], `recording-${Date.now()}.${ext}`, { type: blob.type });
        const url = URL.createObjectURL(file);
        clipUrl.current = url;
        setClip({ file, url, duration, hasAudio });
        setElapsed(duration);
        setState("RECORDED");
      };
      clearClip();
      recorder.current = rec;
      rec.start(250);
      started.current = performance.now();
      setElapsed(0);
      clock.current = setInterval(() => { if (mounted.current) setElapsed((performance.now() - started.current) / 1000); }, 100);
      setState("RECORDING");
    } catch (e) { if (mounted.current) { setError(deviceError(e)); } }
    finally { busy.current = false; if (mounted.current) setCountdown(0); }
  };
  const stop = () => {
    if (recorder.current?.state !== "recording") return;
    setState("STOPPING");
    recorder.current.stop();
  };
  const apply = async (key: "torch" | "zoom", value: boolean | number) => {
    const track = stream.current?.getVideoTracks()[0];
    if (!track || state !== "READY") return;
    if (!capabilities[key]) { setError(`${key === "torch" ? "Flash" : "Zoom"} is not supported by this camera or browser.`); return; }
    try {
      await track.applyConstraints({ advanced: [{ [key]: value } as MediaTrackConstraintSet] });
      if (key === "torch") setTorch(Boolean(value)); else setZoom(Number(value));
      setError(null);
    } catch (e) { setError(deviceError(e)); }
  };
  const discard = () => { clearClip(); setElapsed(0); setState("IDLE"); setError(null); };
  const retake = async () => { discard(); await activate(); };

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false; generation.current++;
      if (clock.current) clearInterval(clock.current);
      const rec = recorder.current;
      if (rec && rec.state !== "inactive") rec.stop();
      release();
      if (clipUrl.current) URL.revokeObjectURL(clipUrl.current);
    };
  }, [release]);

  return { state, error, setError, clip, elapsed, countdown, facing, capabilities, canFlip, torch, zoom, videoRef,
    activate, start, stop, discard, retake, apply, flip: () => activate(facing === "user" ? "environment" : "user") };
}