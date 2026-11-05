ALTER TABLE public.video_jobs ADD COLUMN attempts integer NOT NULL DEFAULT 0;
ALTER TABLE public.video_gateway_state ADD COLUMN worker_token uuid, ADD COLUMN worker_expires timestamptz;
CREATE OR REPLACE FUNCTION public.acquire_video_worker(token uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE s public.video_gateway_state;
BEGIN
 INSERT INTO public.video_gateway_state(id) VALUES(true) ON CONFLICT DO NOTHING;
 SELECT * INTO s FROM public.video_gateway_state WHERE id=true FOR UPDATE;
 IF s.blocked_status IS NOT NULL OR (s.worker_expires IS NOT NULL AND s.worker_expires>now()) THEN RETURN false; END IF;
 UPDATE public.video_gateway_state SET worker_token=token,worker_expires=now()+interval '5 minutes' WHERE id=true;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.acquire_video_worker(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_video_worker(uuid) TO service_role;