-- Phase 2 & 3: User Data Persistence & RLS

-- 1. Bookmarks Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, question_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookmarks" 
ON public.bookmarks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks" 
ON public.bookmarks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.bookmarks FOR DELETE 
USING (auth.uid() = user_id);


-- 2. User Progress Table
CREATE TABLE IF NOT EXISTS public.user_progress (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN ('not_started', 'attempted', 'solved')),
    last_attempted_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, question_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress" 
ON public.user_progress FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
ON public.user_progress FOR UPDATE 
USING (auth.uid() = user_id);


-- 3. User Skill Profile Table
CREATE TABLE IF NOT EXISTS public.user_skill_profile (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    topic_id uuid NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
    skill_level text NOT NULL CHECK (skill_level IN ('weak', 'average', 'strong')),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, topic_id)
);

ALTER TABLE public.user_skill_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own skill profile" 
ON public.user_skill_profile FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own skill profile" 
ON public.user_skill_profile FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skill profile" 
ON public.user_skill_profile FOR UPDATE 
USING (auth.uid() = user_id);
