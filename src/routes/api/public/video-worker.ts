import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
export const Route=createFileRoute("/api/public/video-worker")({server:{handlers:{POST:async({request})=>{
  const failure=await authenticateCronRequest(request);if(failure)return failure;
  const {runScheduledVideos}=await import("@/lib/video.server");await runScheduledVideos();
  return Response.json({processed:true});
}}}});