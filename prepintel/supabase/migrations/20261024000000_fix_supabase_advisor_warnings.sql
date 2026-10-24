-- ==============================================================================
-- PREPINTEL: Fix Supabase Security & Database Advisor Warnings
-- 1. Unindexed Foreign Keys (prevents table lock / full table scans on deletes)
-- 2. Auth RLS Initialization Plan (replaces row-by-row auth.uid() with (SELECT auth.uid()))
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CREATE INDEXES ON FOREIGN KEYS
-- ------------------------------------------------------------------------------

-- public.raw_reports foreign keys
CREATE INDEX IF NOT EXISTS idx_raw_reports_company_id ON public.raw_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_raw_reports_role_id ON public.raw_reports(role_id);
CREATE INDEX IF NOT EXISTS idx_raw_reports_round_id ON public.raw_reports(round_id);
CREATE INDEX IF NOT EXISTS idx_raw_reports_cycle_id ON public.raw_reports(cycle_id);
CREATE INDEX IF NOT EXISTS idx_raw_reports_cluster_id ON public.raw_reports(cluster_id);

-- public.bookmarks foreign keys
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_question_id ON public.bookmarks(question_id);

-- public.user_progress foreign keys
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_question_id ON public.user_progress(question_id);

-- public.user_skill_profile foreign keys
CREATE INDEX IF NOT EXISTS idx_user_skill_profile_user_id ON public.user_skill_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skill_profile_topic_id ON public.user_skill_profile(topic_id);


-- ------------------------------------------------------------------------------
-- 2. FIX AUTH RLS INITIALIZATION PLAN
-- Wrapping auth.uid() in (SELECT auth.uid()) allows Postgres to treat it as an
-- InitPlan subquery evaluated ONCE per statement instead of once per evaluated row.
-- ------------------------------------------------------------------------------

-- Bookmarks Table RLS
DROP POLICY IF EXISTS Users can view their own bookmarks ON public.bookmarks;
CREATE POLICY Users can view their own bookmarks 
ON public.bookmarks FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS Users can insert their own bookmarks ON public.bookmarks;
CREATE POLICY Users can insert their own bookmarks 
ON public.bookmarks FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS Users can delete their own bookmarks ON public.bookmarks;
CREATE POLICY Users can delete their own bookmarks 
ON public.bookmarks FOR DELETE 
USING ((SELECT auth.uid()) = user_id);


-- User Progress Table RLS
DROP POLICY IF EXISTS Users can view their own progress ON public.user_progress;
CREATE POLICY Users can view their own progress 
ON public.user_progress FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS Users can insert their own progress ON public.user_progress;
CREATE POLICY Users can insert their own progress 
ON public.user_progress FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS Users can update their own progress ON public.user_progress;
CREATE POLICY Users can update their own progress 
ON public.user_progress FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);


-- User Skill Profile Table RLS
DROP POLICY IF EXISTS Users can view their own skill profile ON public.user_skill_profile;
CREATE POLICY Users can view their own skill profile 
ON public.user_skill_profile FOR SELECT 
USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS Users can insert their own skill profile ON public.user_skill_profile;
CREATE POLICY Users can insert their own skill profile 
ON public.user_skill_profile FOR INSERT 
WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS Users can update their own skill profile ON public.user_skill_profile;
CREATE POLICY Users can update their own skill profile 
ON public.user_skill_profile FOR UPDATE 
USING ((SELECT auth.uid()) = user_id);


-- Raw Reports Table RLS (Optimizing submitted_by_user_id check)
DO 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'raw_reports' AND policyname = 'Users can view their submitted reports'
    ) THEN
        DROP POLICY Users can view their submitted reports ON public.raw_reports;
        CREATE POLICY Users can view their submitted reports 
        ON public.raw_reports FOR SELECT 
        USING ((SELECT auth.uid()) = submitted_by_user_id);
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'raw_reports' AND policyname = 'Users can insert their own reports'
    ) THEN
        DROP POLICY Users can insert their own reports ON public.raw_reports;
        CREATE POLICY Users can insert their own reports 
        ON public.raw_reports FOR INSERT 
        WITH CHECK ((SELECT auth.uid()) = submitted_by_user_id);
    END IF;
END ;
