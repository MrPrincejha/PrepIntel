-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Core Entities
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    category TEXT
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS recruitment_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    label TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    difficulty_label TEXT CHECK (difficulty_label IN ('Easy', 'Medium', 'Hard')),
    estimated_time_minutes INTEGER,
    external_links JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS question_topics (
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, topic_id)
);

-- Types for Observation pipeline
DO \$\$ BEGIN CREATE TYPE source_type_enum AS ENUM ('user_submission', 'scraped_public', 'screenshot_ocr', 'manual_admin'); EXCEPTION WHEN duplicate_object THEN null; END \$\$;
DO \$\$ BEGIN CREATE TYPE report_status_enum AS ENUM ('pending', 'processed', 'rejected', 'duplicate'); EXCEPTION WHEN duplicate_object THEN null; END \$\$;

CREATE TABLE IF NOT EXISTS raw_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type source_type_enum NOT NULL,
    source_url TEXT,
    raw_text TEXT NOT NULL,
    submitted_by_user_id UUID, -- References auth.users(id) in Supabase
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES recruitment_cycles(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status report_status_enum DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS report_topic_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_report_id UUID REFERENCES raw_reports(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL DEFAULT TRUE,
    extraction_confidence FLOAT
);

CREATE TABLE IF NOT EXISTS report_question_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_report_id UUID REFERENCES raw_reports(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    question_text_raw TEXT,
    matched_confidence FLOAT
);

CREATE TABLE IF NOT EXISTS source_reliability_scores (
    source_type source_type_enum PRIMARY KEY,
    reliability_weight FLOAT NOT NULL,
    last_calibrated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS duplicate_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add cluster reference to raw_reports
ALTER TABLE raw_reports ADD COLUMN cluster_id UUID REFERENCES duplicate_clusters(id) ON DELETE SET NULL;

-- Precomputed analytics
CREATE TABLE IF NOT EXISTS topic_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES recruitment_cycles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    raw_count INTEGER NOT NULL DEFAULT 0,
    weighted_count FLOAT NOT NULL DEFAULT 0,
    raw_frequency FLOAT NOT NULL DEFAULT 0,
    weighted_probability FLOAT NOT NULL DEFAULT 0,
    posterior_mean FLOAT NOT NULL DEFAULT 0,
    credible_interval_low FLOAT NOT NULL DEFAULT 0,
    credible_interval_high FLOAT NOT NULL DEFAULT 0,
    effective_sample_size FLOAT NOT NULL DEFAULT 0,
    recency_score FLOAT NOT NULL DEFAULT 0,
    trend_score FLOAT NOT NULL DEFAULT 0,
    confidence_score FLOAT NOT NULL DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, role_id, round_id, cycle_id, topic_id)
);

CREATE TABLE IF NOT EXISTS question_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES recruitment_cycles(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    topic_score FLOAT NOT NULL DEFAULT 0,
    pattern_score FLOAT NOT NULL DEFAULT 0,
    direct_evidence_score FLOAT NOT NULL DEFAULT 0,
    difficulty_score FLOAT NOT NULL DEFAULT 0,
    recency_score FLOAT NOT NULL DEFAULT 0,
    diversity_score FLOAT NOT NULL DEFAULT 0,
    final_recommendation_score FLOAT NOT NULL DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, role_id, cycle_id, question_id)
);

CREATE TABLE IF NOT EXISTS difficulty_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    round_id UUID REFERENCES rounds(id) ON DELETE CASCADE,
    cycle_id UUID REFERENCES recruitment_cycles(id) ON DELETE CASCADE,
    easy_pct FLOAT NOT NULL DEFAULT 0,
    medium_pct FLOAT NOT NULL DEFAULT 0,
    hard_pct FLOAT NOT NULL DEFAULT 0,
    UNIQUE(company_id, role_id, round_id, cycle_id)
);

-- User-facing state
DO \$\$ BEGIN CREATE TYPE skill_level_enum AS ENUM ('weak', 'medium', 'strong'); EXCEPTION WHEN duplicate_object THEN null; END \$\$;
DO \$\$ BEGIN CREATE TYPE progress_status_enum AS ENUM ('not_started', 'attempted', 'solved'); EXCEPTION WHEN duplicate_object THEN null; END \$\$;

CREATE TABLE IF NOT EXISTS user_skill_profile (
    user_id UUID NOT NULL, -- References auth.users(id)
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    skill_level skill_level_enum NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
    user_id UUID NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    status progress_status_enum NOT NULL DEFAULT 'not_started',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, question_id)
);

CREATE TABLE IF NOT EXISTS prep_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    total_days INTEGER NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prep_plan_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES prep_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    target_completion_pct FLOAT NOT NULL,
    UNIQUE(plan_id, day_number)
);

CREATE TABLE IF NOT EXISTS prep_plan_day_topics (
    plan_day_id UUID REFERENCES prep_plan_days(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (plan_day_id, topic_id)
);

-- Indexes for frequent lookups
CREATE INDEX IF NOT EXISTS idx_raw_reports_lookup ON raw_reports(company_id, role_id, round_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_topic_scores_lookup ON topic_scores(company_id, role_id, round_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_question_scores_lookup ON question_scores(company_id, role_id, cycle_id);
CREATE INDEX IF NOT EXISTS idx_difficulty_dist_lookup ON difficulty_distributions(company_id, role_id, round_id, cycle_id);

-- RLS Policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE difficulty_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on companies" ON companies FOR SELECT USING (true);
CREATE POLICY "Allow public read access on roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Allow public read access on recruitment_cycles" ON recruitment_cycles FOR SELECT USING (true);
CREATE POLICY "Allow public read access on rounds" ON rounds FOR SELECT USING (true);
CREATE POLICY "Allow public read access on topics" ON topics FOR SELECT USING (true);
CREATE POLICY "Allow public read access on questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Allow public read access on question_topics" ON question_topics FOR SELECT USING (true);
CREATE POLICY "Allow public read access on topic_scores" ON topic_scores FOR SELECT USING (true);
CREATE POLICY "Allow public read access on question_scores" ON question_scores FOR SELECT USING (true);
CREATE POLICY "Allow public read access on difficulty_distributions" ON difficulty_distributions FOR SELECT USING (true);

-- User private data
ALTER TABLE user_skill_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE prep_plan_day_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own skill profile" ON user_skill_profile 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own bookmarks" ON bookmarks 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own progress" ON user_progress 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own prep plans" ON prep_plans 
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own prep plan days" ON prep_plan_days 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM prep_plans 
            WHERE prep_plans.id = prep_plan_days.plan_id 
            AND prep_plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own prep plan day topics" ON prep_plan_day_topics 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM prep_plan_days 
            JOIN prep_plans ON prep_plans.id = prep_plan_days.plan_id
            WHERE prep_plan_days.id = prep_plan_day_topics.plan_day_id 
            AND prep_plans.user_id = auth.uid()
        )
    );



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


-- Phase 4: Core Data Pipeline Schema Enhancements

-- 1. Add missing columns to raw_reports
ALTER TABLE public.raw_reports 
ADD COLUMN IF NOT EXISTS content_hash TEXT,
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS attempt_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Add Unique Constraint on content_hash to prevent duplicate ingestion
-- We only enforce uniqueness if content_hash is not null
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_reports_content_hash ON public.raw_reports(content_hash) WHERE content_hash IS NOT NULL;

-- 3. Add idempotency constraints for observations
ALTER TABLE public.report_topic_observations 
ADD CONSTRAINT unique_report_topic UNIQUE (raw_report_id, topic_id);

ALTER TABLE public.report_question_observations 
ADD CONSTRAINT unique_report_question UNIQUE (raw_report_id, question_id);

