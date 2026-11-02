CREATE TABLE public.video_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
 request jsonb NOT NULL, provider_id text, provider_status text, progress real,
 state text NOT NULL DEFAULT 'QUEUED' CHECK (state IN ('QUEUED','SUBMITTING','GENERATING','SAVING','COMPLETED','FAILED')),
 asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL, error text, retry_after timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.video_jobs TO authenticated;
GRANT ALL ON public.video_jobs TO service_role;
ALTER TABLE public.video_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY video_jobs_read_own ON public.video_jobs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TABLE public.video_gateway_state (id boolean PRIMARY KEY DEFAULT true CHECK (id), active_job uuid REFERENCES public.video_jobs(id), blocked_status integer, blocked_message text, blocked_type text);
GRANT ALL ON public.video_gateway_state TO service_role;
ALTER TABLE public.video_gateway_state ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.claim_video_job(job_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.video_gateway_state; j public.video_jobs;
BEGIN
 INSERT INTO public.video_gateway_state(id) VALUES(true) ON CONFLICT DO NOTHING;
 SELECT * INTO s FROM public.video_gateway_state WHERE id = true FOR UPDATE;
 IF s.blocked_status IS NOT NULL THEN RETURN false; END IF;
 SELECT * INTO j FROM public.video_jobs WHERE id = job_id FOR UPDATE;
 IF j.state <> 'QUEUED' OR (j.retry_after IS NOT NULL AND j.retry_after > now()) THEN RETURN false; END IF;
 IF s.active_job IS NOT NULL THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM public.video_jobs WHERE state='QUEUED' AND created_at < j.created_at) THEN RETURN false; END IF;
 UPDATE public.video_gateway_state SET active_job=job_id WHERE id=true;
 UPDATE public.video_jobs SET state='SUBMITTING', updated_at=now() WHERE id=job_id;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.claim_video_job(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_video_job(uuid) TO service_role;
CREATE INDEX video_jobs_user_created ON public.video_jobs(user_id,created_at DESC);