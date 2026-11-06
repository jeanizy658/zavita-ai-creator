import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Clapperboard, Download, ImagePlus, Loader2, Plus, RefreshCw, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModuleHeader } from "@/components/zavita/ModuleHeader";
import { useAuth } from "@/lib/auth";
import { useStudio } from "@/lib/studio-store";
import { submitVideo, syncVideos, videoAvailability, resumeVideoService } from "@/lib/video.functions";
import { VIDEO_DURATIONS, VIDEO_RATIOS, VIDEO_RESOLUTIONS, CAMERA_MOVEMENTS, VIDEO_STYLES, MOTION_LEVELS, videoInput, type VideoInput } from "@/lib/video-settings";
import { listAssets, listProjects, uploadAsset, appendAssets, attachAssetToProject, type Asset, type Project } from "@/lib/data";
import { signedUrl, uploadToStorage } from "@/lib/storage";
import { generateThumbnail, formatDuration } from "@/lib/media";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type Job = Database["public"]["Tables"]["video_jobs"]["Row"];
export const Route = createFileRoute("/ai-video")({ head: () => ({ meta: [
  { title: "AI Video Studio — ZAVITA" }, { name: "description", content: "Create real AI videos from text or your images, and save them to private ZAVITA projects." },
  { property: "og:title", content: "AI Video Studio — ZAVITA" }, { property: "og:description", content: "Animate your images or create new video clips in ZAVITA." },
  { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
] }), component: VideoStudio });
const initial: VideoInput = { prompt: "", mode: "text", duration: 5, ratio: "9:16", resolution: "720p", camera: "Natural", atmosphere: "", style: "Photorealistic", motion: "Medium", sourceAssetId: null, projectId: null };
const stateLabels: Record<string,string> = { QUEUED:"Waiting in queue", SUBMITTING:"Preparing request", GENERATING:"Generation in progress", SAVING:"Processing · saving privately", COMPLETED:"Completed", FAILED:"Failed" };

function VideoStudio() {
  const { user, loading } = useAuth(); const studio=useStudio(); const navigate=useNavigate();
  const submit=useServerFn(submitVideo); const sync=useServerFn(syncVideos); const availability=useServerFn(videoAvailability); const resume=useServerFn(resumeVideoService);
  const [settings,setSettings]=useState<VideoInput>(initial); const [jobs,setJobs]=useState<Job[]>([]); const [projects,setProjects]=useState<Project[]>([]);
  const [assets,setAssets]=useState<Asset[]>([]); const [urls,setUrls]=useState<Record<string,string>>({}); const [selected,setSelected]=useState<string|null>(null);
  const [busy,setBusy]=useState(false); const [error,setError]=useState<string|null>(null); const [notice,setNotice]=useState<string|null>(null);
  const [blocked,setBlocked]=useState<string|null>(null); const [configured,setConfigured]=useState(true); const [imageFilter,setImageFilter]=useState("");
  const [uploadStatus,setUploadStatus]=useState<string|null>(null); const lock=useRef(false); const syncLock=useRef(false); const requestId=useRef<string|null>(null);
  const input=useRef<HTMLInputElement>(null); const video=useRef<HTMLVideoElement>(null);
  const current=jobs.find(j=>j.id===selected); const asset=assets.find(a=>a.id===current?.asset_id);
  const active=current && !["COMPLETED","FAILED"].includes(current.state);
  const images=assets.filter(a=>["image/png","image/jpeg","image/webp"].includes(a.mime_type ?? "") && (a.size ?? 0)<=10*1024*1024 && (!imageFilter || a.project_id===imageFilter));
  const update=<K extends keyof VideoInput>(key:K,value:VideoInput[K])=>{ requestId.current=null; setSettings(s=>({...s,[key]:value})); };
  const loadMedia=useCallback(async()=>{
    const [a,p]=await Promise.all([listAssets(),listProjects()]);
    const pairs=await Promise.all(a.map(async item=>[item.id,await signedUrl(item.storage_path)] as const));
    setAssets(a); setProjects(p); setUrls(Object.fromEntries(pairs.filter((p):p is readonly [string,string]=>Boolean(p[1]))));
  },[]);
  const refresh=useCallback(async()=>{
    if(syncLock.current) return; syncLock.current=true;
    try { const result=await sync(); setJobs(result.jobs); setBlocked(result.blocked); await loadMedia(); }
    catch(e) { setError(e instanceof Error?e.message:"Generation status is unavailable."); }
    finally { syncLock.current=false; }
  },[sync,loadMedia]);
  useEffect(()=>{
    setJobs([]); setAssets([]); setUrls({}); setSelected(null); setError(null); setBlocked(null);
    if(!user) return;
    void availability().then(a=>setConfigured(a.configured&&a.enabled)).catch(e=>setError(e.message));
    void refresh();
    const timer=setInterval(()=>void refresh(),8000); return()=>clearInterval(timer);
  },[user?.id,refresh,availability]);
  useEffect(()=>{ if(studio.projectId) setSettings(s=>({...s,projectId:studio.projectId})); },[studio.projectId]);
  useEffect(()=>{ if(!selected&&jobs.length) setSelected(jobs[0]?.id??null); },[jobs,selected]);

  const generate=async()=>{
    if(lock.current||!user) return;
    const valid=videoInput.safeParse(settings); if(!valid.success){setError(valid.error.issues[0]?.message??"Check your settings.");return;}
    lock.current=true;setBusy(true);setError(null);setNotice(null);
    try { requestId.current??=crypto.randomUUID(); const job=await submit({data:{requestId:requestId.current,settings:valid.data}}); setSelected(job.id); setJobs(j=>[job,...j.filter(row=>row.id!==job.id)]); requestId.current=null; await refresh(); }
    catch(e){setError(e instanceof Error?e.message:"Request failed.");} finally{lock.current=false;setBusy(false);}
  };
  const upload=async(file:File)=>{
    if(!user||lock.current)return;
    if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>10*1024*1024){setError("Select a PNG, JPEG or WebP image under 10 MB.");return;}
    lock.current=true;setBusy(true);setError(null);
    try { const image=await uploadAsset({userId:user.id,file,onState:s=>setUploadStatus(s.status==="UPLOADING"?`Uploading ${s.progress}%`:s.status==="READY"?null:s.status==="FAILED"?null:s.status.toLowerCase())}); update("sourceAssetId",image.id); await loadMedia(); }
    catch(e){setError(e instanceof Error?e.message:"Image upload failed.");}finally{lock.current=false;setBusy(false);setUploadStatus(null);if(input.current)input.current.value="";}
  };
  const readMetadata=async(item:Asset,url:string)=>{
    const element=document.createElement("video");element.preload="metadata";
    const metadata=await new Promise<{duration:number;width:number;height:number}>((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error("Video metadata could not be read.")),15000);
      element.onloadedmetadata=()=>{clearTimeout(timer); if(!Number.isFinite(element.duration)||element.duration<=0){reject(new Error("Video duration is unavailable."));return;} if(!element.videoWidth||!element.videoHeight){clearTimeout(timer);reject(new Error("Saved file has no video track."));return;} resolve({duration:element.duration,width:element.videoWidth,height:element.videoHeight});};
      element.onerror=()=>{clearTimeout(timer);reject(new Error("Saved video could not be played."));};element.src=url;
    }).finally(()=>{element.removeAttribute("src");element.load();});
    const existing=item.metadata&&typeof item.metadata==="object"&&!Array.isArray(item.metadata)?item.metadata:{};
    const q=await supabase.from("assets").update({duration:metadata.duration,metadata:{...existing,...metadata}}).eq("id",item.id);if(q.error)throw new Error(q.error.message);
    return metadata;
  };
  const action=async(kind:"download"|"project"|"editor")=>{
    if(!asset||!user||lock.current)return;lock.current=true;setBusy(true);setError(null);setNotice(null);
    try {
      const url=await signedUrl(asset.storage_path);if(!url)throw new Error("Saved video unavailable.");
      if(kind==="download") {const r=await fetch(url);if(!r.ok)throw new Error("Download failed.");const local=URL.createObjectURL(await r.blob());const a=document.createElement("a");a.href=local;a.download=asset.name;a.click();setTimeout(()=>URL.revokeObjectURL(local),1000);}
      else{
        const id=settings.projectId||await studio.ensureProject();await attachAssetToProject(asset.id,id);
        if(kind==="editor"){
          const metadata=await readMetadata(asset,url);
          const clips=await supabase.from("timeline_clips").select("id").eq("project_id",id).eq("asset_id",asset.id).eq("track_type","MAIN");if(clips.error)throw new Error(clips.error.message);
          if(!clips.data.length)await appendAssets(user.id,id,[{assetId:asset.id,track:"MAIN",duration:metadata.duration,label:asset.name}]);
          await studio.openProject(id);await navigate({to:"/editor"});
        }else{await readMetadata(asset,url);setNotice("Video added to project");await loadMedia();}
      }
    }catch(e){setError(e instanceof Error?e.message:"Action failed.");}finally{lock.current=false;setBusy(false);}
  };
  const thumbnail=async()=>{
    if(!asset||asset.thumbnail_url||!user||lock.current)return;
    lock.current=true;try{
      const url=await signedUrl(asset.storage_path);if(!url)return;const r=await fetch(url);if(!r.ok)return;
      await readMetadata(asset,url);
      const blob=await r.blob();const thumb=await generateThumbnail(new File([blob],asset.name,{type:"video/mp4"}),"video");if(!thumb)return;
      const path=await uploadToStorage(user.id,thumb,`${asset.id}.thumb.jpg`).promise;
      const q=await supabase.from("assets").update({thumbnail_url:path}).eq("id",asset.id);if(q.error)throw new Error(q.error.message);await loadMedia();
    }catch(e){setError("Video saved; thumbnail unavailable: "+(e instanceof Error?e.message:"unknown error"));}finally{lock.current=false;}
  };
  const reopen=(j:Job)=>{setSelected(j.id);const parsed=videoInput.safeParse(j.request);if(parsed.success)setSettings(parsed.data);setError(null);setNotice(null);requestId.current=null;};
  const selectClass="mt-2 h-11 w-full rounded-lg border border-border bg-surface px-3 text-[13px]";
  return <div className="min-h-[100dvh] bg-background pb-10"><ModuleHeader title="AI Video Studio" subtitle="Bring your ideas to life" />
    <main className="mx-auto grid max-w-[1000px] gap-7 px-4 pt-5 md:grid-cols-2">
      <section className="min-w-0"><h1 className="mb-5 text-xl font-bold">AI <span className="text-gradient">VIDEO STUDIO</span></h1>
        <div className="mb-5 grid grid-cols-2 gap-2">{(["text","image"] as const).map(m=><Button key={m} variant="outline" disabled={busy} aria-pressed={settings.mode===m} onClick={()=>update("mode",m)} className={cn("text-xs",settings.mode===m&&"border-accent bg-accent/10 text-accent")}>{m==="text"?<Clapperboard/>:<ImagePlus/>}{m==="text"?"Text to video":"Image to video"}</Button>)}</div>
        {settings.mode==="image"&&<div className="mb-5 space-y-3">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);}}/>
          <Button variant="outline" disabled={!user||busy} onClick={()=>input.current?.click()} className="w-full"><Upload/>Upload image</Button>
          {uploadStatus&&<p role="status" className="text-xs text-accent">{uploadStatus}</p>}
          <label className="block text-xs text-muted-foreground" htmlFor="video-image-project">Image library</label>
          <select id="video-image-project" value={imageFilter} onChange={e=>setImageFilter(e.target.value)} className={selectClass}><option value="">All my images</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select>
          <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto">{images.map(a=><Button key={a.id} variant="outline" aria-label={`Select ${a.name}`} aria-pressed={a.id===settings.sourceAssetId} onClick={()=>update("sourceAssetId",a.id)} className={cn("h-20 overflow-hidden p-0",a.id===settings.sourceAssetId&&"border-accent")}><img src={urls[a.id]} alt={a.name} className="size-full object-cover"/></Button>)}</div>
          {settings.sourceAssetId&&urls[settings.sourceAssetId]&&<img src={urls[settings.sourceAssetId]} alt="Selected source image" className="max-h-52 w-full rounded-lg object-contain"/>}
          {user&&!images.length&&<p className="text-xs text-muted-foreground">No supported images in this library.</p>}
        </div>}
        <label htmlFor="video-prompt" className="text-[11px] font-bold uppercase text-muted-foreground">{settings.mode==="image"?"Animation prompt":"Prompt"}</label>
        <textarea id="video-prompt" rows={5} maxLength={4000} value={settings.prompt} disabled={busy} onChange={e=>update("prompt",e.target.value)} placeholder={settings.mode==="image"?"Describe the movement, camera and atmosphere…":"A tropical coastline at sunrise, waves rolling onto the sand, gentle ocean sounds…"} className="mt-2 w-full resize-y rounded-lg border border-border bg-surface p-3 text-[13px] outline-none focus:border-accent"/>
        <div className="mt-2 flex flex-wrap gap-1">{["Aerial coastline at sunrise","A flower opening in soft light"].map(p=><Button key={p} variant="ghost" size="sm" disabled={busy} onClick={()=>update("prompt",p+", in a single continuous shot.")} className="h-auto max-w-full whitespace-normal text-left text-[10px] text-muted-foreground">{p}</Button>)}</div>
        <div className="mt-5 grid grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">Duration<select aria-label="Video duration" value={settings.duration} disabled={busy} onChange={e=>update("duration",Number(e.target.value))} className={selectClass}>{VIDEO_DURATIONS.map(d=><option key={d} value={d}>{d} seconds</option>)}</select></label><label className="text-xs text-muted-foreground">Resolution<select aria-label="Video resolution" value={settings.resolution} disabled={busy} onChange={e=>update("resolution",e.target.value as VideoInput["resolution"])} className={selectClass}>{VIDEO_RESOLUTIONS.map(r=><option key={r}>{r}</option>)}</select></label></div>
        <div className="mt-5 grid grid-cols-2 gap-3"><label className="text-xs text-muted-foreground">Visual style<select aria-label="Visual style" value={settings.style} disabled={busy} onChange={e=>update("style",e.target.value as VideoInput["style"])} className={selectClass}>{VIDEO_STYLES.map(v=><option key={v}>{v}</option>)}</select></label><label className="text-xs text-muted-foreground">Motion<select aria-label="Motion level" value={settings.motion} disabled={busy} onChange={e=>update("motion",e.target.value as VideoInput["motion"])} className={selectClass}>{MOTION_LEVELS.map(v=><option key={v}>{v}</option>)}</select></label></div>
        <p className="mb-2 mt-5 text-[11px] font-bold uppercase text-muted-foreground">Aspect ratio</p><div className="grid grid-cols-2 gap-2">{VIDEO_RATIOS.map(r=><Button key={r} variant="outline" disabled={busy} aria-pressed={settings.ratio===r} onClick={()=>update("ratio",r)} className={cn("text-xs",settings.ratio===r&&"border-accent text-accent")}>{r} · {r==="9:16"?"Portrait":"Landscape"}</Button>)}</div>
        <details className="mt-5 border-t border-border pt-3"><summary className="cursor-pointer text-xs font-semibold">Scene direction</summary><label className="mt-3 block text-xs text-muted-foreground">Camera<select aria-label="Camera movement" value={settings.camera} disabled={busy} onChange={e=>update("camera",e.target.value as VideoInput["camera"])} className={selectClass}>{CAMERA_MOVEMENTS.map(c=><option key={c}>{c}</option>)}</select></label><label className="mt-3 block text-xs text-muted-foreground">Lighting & atmosphere<input aria-label="Lighting and atmosphere" value={settings.atmosphere} maxLength={200} disabled={busy} onChange={e=>update("atmosphere",e.target.value)} className={selectClass} placeholder="Soft sunrise, cinematic lighting…"/></label></details>
        <label htmlFor="video-project" className="mt-5 block text-[11px] font-bold uppercase text-muted-foreground">Project</label><select id="video-project" value={settings.projectId??""} disabled={busy} onChange={e=>update("projectId",e.target.value||null)} className={selectClass}><option value="">Media library</option>{projects.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select>
        {!configured&&<p role="alert" className="mt-3 text-xs text-destructive">Video generation is not configured or is disabled.</p>}
        {!user&&!loading?<Button asChild className="mt-5 h-12 w-full bg-gradient-brand"><Link to="/auth">Sign in to generate video</Link></Button>:<Button disabled={busy||loading||!configured||Boolean(blocked)} onClick={()=>void generate()} className="mt-5 h-12 w-full bg-gradient-brand">{busy?<Loader2 className="animate-spin"/>:<Sparkles/>}Generate video</Button>}
        {error&&<p role="alert" className="mt-3 break-words text-xs text-destructive">{error}</p>}{notice&&<p role="status" className="mt-3 text-xs text-accent">{notice}</p>}
        {blocked&&<div className="mt-3"><p role="alert" className="break-words text-xs text-destructive">{blocked}</p><Button variant="outline" className="mt-2" onClick={()=>void resume().then(()=>refresh()).catch(e=>setError(e.message))}>Resume after access is restored</Button></div>}
      </section>
      <section className="min-w-0">
        <div className="flex aspect-[9/10] items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
          {asset&&urls[asset.id]?<video key={asset.id} ref={video} src={urls[asset.id]} controls playsInline preload="metadata" className="max-h-full w-full" aria-label="Generated video" onLoadedData={()=>void thumbnail()} onError={()=>setError("The saved video could not be played. Reopen or download it.")}/>:<div className="px-4 text-center"><Clapperboard className="mx-auto size-10 text-muted-foreground"/>{current&&<p role="status" className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">{active&&<Loader2 className="size-4 animate-spin"/>}{stateLabels[current.state]}</p>}{current?.progress!=null&&current.state==="GENERATING"&&<progress value={current.progress} max={100} aria-label="Provider generation progress" className="mt-3 w-full"/>}</div>}
        </div>
        {current&&<div className="mt-3 text-[11px] text-muted-foreground"><p className="flex items-center gap-1">{current.state==="COMPLETED"&&<Check className="size-3 text-accent"/>}{stateLabels[current.state]}</p>{current.error&&<p role="alert" className="mt-2 break-words text-destructive">{current.error}</p>}<details className="mt-2"><summary className="cursor-pointer">Generation details</summary><p className="mt-2 break-all">Provider job: {current.provider_id??"Not submitted yet"}</p><p>Created: {new Date(current.created_at).toLocaleString()}</p><p>Provider status: {current.provider_status??"Waiting"}</p></details></div>}
        {asset&&<div className="mt-4 grid grid-cols-2 gap-2"><Button variant="outline" disabled={busy} onClick={()=>void action("download")}><Download/>Download</Button><Button variant="outline" disabled={busy} onClick={()=>{if(video.current){video.current.currentTime=0;void video.current.play().catch(e=>setError(e.message));}}}><RefreshCw/>Replay</Button><Button variant="outline" disabled={busy} onClick={()=>void action("project")}><Plus/>Add to project</Button><Button className="bg-gradient-brand" disabled={busy} onClick={()=>void action("editor")}><Clapperboard/>Open in Editor</Button></div>}
        {(asset||current?.state==="FAILED")&&<Button variant="ghost" disabled={busy||Boolean(blocked)} onClick={()=>{requestId.current=null;void generate();}} className="mt-2"><RefreshCw/>{asset?"Generate another":"Start a new request"}</Button>}
        {active&&<Button variant="ghost" onClick={()=>void refresh()} className="mt-2"><RefreshCw/>Check status</Button>}
        <h2 className="mb-3 mt-7 text-[11px] font-bold uppercase text-muted-foreground">Generation history</h2>{!jobs.length&&<p className="text-xs text-muted-foreground">No video generations yet.</p>}
        <div className="space-y-2">{jobs.map(j=>{const s=videoInput.safeParse(j.request);const item=assets.find(a=>a.id===j.asset_id);return <Button key={j.id} variant="outline" onClick={()=>reopen(j)} className={cn("h-auto w-full justify-start gap-3 p-2 text-left",selected===j.id&&"border-accent")}><span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-2">{item&&urls[item.id]?<video src={urls[item.id]} preload="metadata" muted playsInline className="size-full object-cover"/>:<Clapperboard className="text-muted-foreground"/>}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs">{s.success?s.data.prompt:"Video request"}</span><span className="block whitespace-normal text-[10px] text-muted-foreground">{s.success?`${s.data.mode==="image"?"Image to video":"Text to video"} · ${item?.duration?formatDuration(item.duration):`${s.data.duration}s requested`} · ${s.data.resolution}`:""}</span><span className="block whitespace-normal text-[10px] text-muted-foreground">{stateLabels[j.state]} · {new Date(j.created_at).toLocaleDateString()}</span></span></Button>;})}</div>
      </section>
    </main>
  </div>;
}