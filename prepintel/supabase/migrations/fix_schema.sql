CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    difficulty_label TEXT CHECK (difficulty_label IN ('Easy', 'Medium', 'Hard')),
    estimated_time_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.user_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN ('not_started', 'attempted', 'solved')),
    last_attempted_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS public.user_skill_profile (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL,
    skill_level text NOT NULL CHECK (skill_level IN ('weak', 'average', 'strong')),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, topic_id)
);

-- Phase 4 Extensions
ALTER TABLE public.raw_reports 
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
