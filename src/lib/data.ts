import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { generateThumbnail, probeDuration, validateFile, type MediaKind } from "@/lib/media";
import { uploadToStorage } from "@/lib/storage";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Asset = Database["public"]["Tables"]["assets"]["Row"];
export type TimelineClip = Database["public"]["Tables"]["timeline_clips"]["Row"];
export type AiJob = Database["public"]["Tables"]["ai_jobs"]["Row"];
export type AssetType = Database["public"]["Enums"]["asset_type"];
export type TrackType = Database["public"]["Enums"]["track_type"];

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/* ---------------------------------- projects --------------------------------- */

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  fail(error);
  return data ?? [];
}

export async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  fail(error);
  return data ?? null;
}

export async function createProject(userId: string, title = "Untitled project"): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, title })
    .select("*")
    .single();
  fail(error);
  return data!;
}

export async function updateProject(id: string, patch: Database["public"]["Tables"]["projects"]["Update"]) {
  const { data, error } = await supabase.from("projects").update(patch).eq("id", id).select("*").single();
  fail(error);
  return data!;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  fail(error);
}

/** Returns the most recent project, creating one when the account has none. */
export async function ensureActiveProject(userId: string): Promise<Project> {
  const projects = await listProjects();
  if (projects[0]) return projects[0];
  return createProject(userId, "My first project");
}

/* ----------------------------------- assets ---------------------------------- */

export async function listAssets(projectId?: string | null): Promise<Asset[]> {
  let query = supabase.from("assets").select("*").order("created_at", { ascending: false }).limit(60);
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  fail(error);
  return data ?? [];
}

export async function deleteAsset(id: string) {
  const { error } = await supabase.from("assets").delete().eq("id", id);
  fail(error);
}

export async function attachAssetToProject(assetId: string, projectId: string) {
  const { error } = await supabase.from("assets").update({ project_id: projectId }).eq("id", assetId);
  fail(error);
}

const KIND_TO_TYPE: Record<MediaKind, AssetType> = {
  video: "VIDEO",
  image: "PHOTO",
  audio: "AUDIO",
};

export type UploadState =
  | { status: "IDLE" }
  | { status: "SELECTED"; name: string }
  | { status: "UPLOADING"; name: string; progress: number }
  | { status: "PROCESSING"; name: string }
  | { status: "READY"; asset: Asset }
  | { status: "FAILED"; name: string; error: string };

/**
 * Full real pipeline: validate → read duration → make a real thumbnail →
 * upload file (with progress) → upload thumbnail → create the asset row.
 */
export async function uploadAsset(opts: {
  userId: string;
  projectId?: string | null;
  file: File | Blob;
  filename?: string;
  assetType?: AssetType;
  onState: (state: UploadState) => void;
}): Promise<Asset> {
  const filename = opts.filename ?? (opts.file instanceof File ? opts.file.name : "recording.webm");
  const file =
    opts.file instanceof File
      ? opts.file
      : new File([opts.file], filename, { type: opts.file.type || "application/octet-stream" });

  const checked = validateFile(file);
  if ("error" in checked) {
    opts.onState({ status: "FAILED", name: filename, error: checked.error });
    throw new Error(checked.error);
  }

  try {
    opts.onState({ status: "SELECTED", name: filename });
    const duration = await probeDuration(file, checked.kind);
    const thumb = await generateThumbnail(file, checked.kind);

    opts.onState({ status: "UPLOADING", name: filename, progress: 0 });
    const path = await uploadToStorage(opts.userId, file, filename, (p) =>
      opts.onState({ status: "UPLOADING", name: filename, progress: p }),
    ).promise;

    opts.onState({ status: "PROCESSING", name: filename });
    let thumbPath: string | null = null;
    if (thumb) {
      thumbPath = await uploadToStorage(opts.userId, thumb, `${filename}.thumb.jpg`).promise;
    }

    const { data, error } = await supabase
      .from("assets")
      .insert({
        user_id: opts.userId,
        project_id: opts.projectId ?? null,
        type: opts.assetType ?? KIND_TO_TYPE[checked.kind],
        name: filename,
        storage_path: path,
        thumbnail_url: thumbPath,
        duration,
        mime_type: file.type,
        size: file.size,
      })
      .select("*")
      .single();
    fail(error);
    opts.onState({ status: "READY", asset: data! });
    return data!;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upload failed. Please try again.";
    opts.onState({ status: "FAILED", name: filename, error: message });
    throw e;
  }
}

/* --------------------------------- timeline ---------------------------------- */

export async function listClips(projectId: string): Promise<TimelineClip[]> {
  const { data, error } = await supabase
    .from("timeline_clips")
    .select("*")
    .eq("project_id", projectId)
    .order("start_time", { ascending: true });
  fail(error);
  return data ?? [];
}

export async function addClip(clip: Database["public"]["Tables"]["timeline_clips"]["Insert"]) {
  const { data, error } = await supabase.from("timeline_clips").insert(clip).select("*").single();
  fail(error);
  return data!;
}

export async function updateClip(
  id: string,
  patch: Database["public"]["Tables"]["timeline_clips"]["Update"],
) {
  const { data, error } = await supabase.from("timeline_clips").update(patch).eq("id", id).select("*").single();
  fail(error);
  return data!;
}

export async function deleteClip(id: string) {
  const { error } = await supabase.from("timeline_clips").delete().eq("id", id);
  fail(error);
}

/* ---------------------------------- ai jobs ---------------------------------- */

export async function listJobs(projectId?: string | null): Promise<AiJob[]> {
  let query = supabase.from("ai_jobs").select("*").order("created_at", { ascending: false }).limit(30);
  if (projectId) query = query.eq("project_id", projectId);
  const { data, error } = await query;
  fail(error);
  return data ?? [];
}

export async function createJob(job: Database["public"]["Tables"]["ai_jobs"]["Insert"]) {
  const { data, error } = await supabase.from("ai_jobs").insert(job).select("*").single();
  fail(error);
  return data!;
}

export async function updateJob(id: string, patch: Database["public"]["Tables"]["ai_jobs"]["Update"]) {
  const { data, error } = await supabase.from("ai_jobs").update(patch).eq("id", id).select("*").single();
  fail(error);
  return data!;
}
