CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TYPE public.project_status AS ENUM ('DRAFT','READY','SCHEDULED','PUBLISHED');
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled project',
  description TEXT,
  thumbnail_url TEXT,
  duration NUMERIC NOT NULL DEFAULT 0,
  status public.project_status NOT NULL DEFAULT 'DRAFT',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.projects FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX projects_user_idx ON public.projects (user_id, updated_at DESC);

CREATE TYPE public.asset_type AS ENUM ('VIDEO','PHOTO','AUDIO','MUSIC','VOICE','IMAGE','LOGO','AI_VISUAL','AI_VIDEO','GRAPHIC','TEXT');
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects ON DELETE CASCADE,
  type public.asset_type NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  duration NUMERIC,
  mime_type TEXT,
  size BIGINT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own assets" ON public.assets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX assets_user_idx ON public.assets (user_id, created_at DESC);

CREATE TYPE public.track_type AS ENUM ('MAIN','OVERLAY','PHOTO','TEXT','AI_VISUAL','AUDIO');
CREATE TABLE public.timeline_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects ON DELETE CASCADE,
  asset_id UUID REFERENCES public.assets ON DELETE SET NULL,
  track_type public.track_type NOT NULL,
  label TEXT,
  start_time NUMERIC NOT NULL DEFAULT 0,
  end_time NUMERIC NOT NULL DEFAULT 0,
  duration NUMERIC NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  locked BOOLEAN NOT NULL DEFAULT false,
  volume NUMERIC NOT NULL DEFAULT 1,
  opacity NUMERIC NOT NULL DEFAULT 1,
  scale NUMERIC NOT NULL DEFAULT 1,
  rotation NUMERIC NOT NULL DEFAULT 0,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.timeline_clips TO authenticated;
GRANT ALL ON public.timeline_clips TO service_role;
ALTER TABLE public.timeline_clips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own clips" ON public.timeline_clips FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER timeline_clips_updated_at BEFORE UPDATE ON public.timeline_clips FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX timeline_clips_project_idx ON public.timeline_clips (project_id, track_type, start_time);

CREATE TYPE public.job_status AS ENUM ('QUEUED','PROCESSING','COMPLETED','FAILED','CANCELLED');
CREATE TABLE public.ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects ON DELETE CASCADE,
  type TEXT NOT NULL,
  status public.job_status NOT NULL DEFAULT 'QUEUED',
  progress INTEGER NOT NULL DEFAULT 0,
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  output JSONB,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_jobs TO authenticated;
GRANT ALL ON public.ai_jobs TO service_role;
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own jobs" ON public.ai_jobs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER ai_jobs_updated_at BEFORE UPDATE ON public.ai_jobs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX ai_jobs_user_idx ON public.ai_jobs (user_id, created_at DESC);