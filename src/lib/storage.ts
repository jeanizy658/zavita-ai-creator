import { supabase } from "@/integrations/supabase/client";

const BUCKET = "media";

function storageBaseUrl() {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  if (!url) throw new Error("Storage is not configured.");
  return `${url}/storage/v1/object`;
}

export type UploadHandle = { promise: Promise<string>; abort: () => void };

/**
 * Uploads a file to the private media bucket with real byte-level progress.
 * Returns the storage path (userId/...). Throws on failure.
 */
export function uploadToStorage(
  userId: string,
  file: Blob,
  filename: string,
  onProgress?: (percent: number) => void,
): UploadHandle {
  const safe = filename.replace(/[^\w.\-]+/g, "_").slice(-80);
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const xhr = new XMLHttpRequest();

  const promise = (async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("You must be signed in to upload media.");
    const apikey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] as string;

    return await new Promise<string>((resolve, reject) => {
      xhr.open("POST", `${storageBaseUrl()}/${BUCKET}/${path}`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("apikey", apikey);
      xhr.setRequestHeader("x-upsert", "true");
      if (file.type) xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(path);
        else reject(new Error(`Upload failed (${xhr.status}). Please try again.`));
      };
      xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
      xhr.onabort = () => reject(new Error("Upload cancelled."));
      xhr.send(file);
    });
  })();

  return { promise, abort: () => xhr.abort() };
}

const signedCache = new Map<string, { url: string; expires: number }>();

/** Returns a time-limited signed URL for a private stored file. */
export async function signedUrl(path: string | null | undefined, expiresIn = 3600) {
  if (!path) return null;
  const cached = signedCache.get(path);
  if (cached && cached.expires > Date.now()) return cached.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  signedCache.set(path, { url: data.signedUrl, expires: Date.now() + (expiresIn - 60) * 1000 });
  return data.signedUrl;
}

export async function removeFromStorage(path: string) {
  await supabase.storage.from(BUCKET).remove([path]);
}
