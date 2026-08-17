-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Core Entities
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    category TEXT
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE recruitment_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INTEGER NOT NULL,
    label TEXT NOT NULL
);

CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL
);

CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_topic_id UUID REFERENCES topics(id) ON DELETE SET NULL
);

CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    difficulty_label TEXT CHECK (difficulty_label IN ('Easy', 'Medium', 'Hard')),
    estimated_time_minutes INTEGER,
    external_links JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE question_topics (
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, topic_id)
);

-- Types for Observation pipeline
CREATE TYPE source_type_enum AS ENUM ('user_submission', 'scraped_public', 'screenshot_ocr', 'manual_admin');
CREATE TYPE report_status_enum AS ENUM ('pending', 'processed', 'rejected', 'duplicate');

CREATE TABLE raw_reports (
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

CREATE TABLE report_topic_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_report_id UUID REFERENCES raw_reports(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    present BOOLEAN NOT NULL DEFAULT TRUE,
    extraction_confidence FLOAT
);

CREATE TABLE report_question_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raw_report_id UUID REFERENCES raw_reports(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
    question_text_raw TEXT,
    matched_confidence FLOAT
);

CREATE TABLE source_reliability_scores (
    source_type source_type_enum PRIMARY KEY,
    reliability_weight FLOAT NOT NULL,
    last_calibrated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE duplicate_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cluster_method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add cluster reference to raw_reports
ALTER TABLE raw_reports ADD COLUMN cluster_id UUID REFERENCES duplicate_clusters(id) ON DELETE SET NULL;

-- Precomputed analytics
CREATE TABLE topic_scores (
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

CREATE TABLE question_scores (
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

CREATE TABLE difficulty_distributions (
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
CREATE TYPE skill_level_enum AS ENUM ('weak', 'medium', 'strong');
CREATE TYPE progress_status_enum AS ENUM ('not_started', 'attempted', 'solved');

CREATE TABLE user_skill_profile (
    user_id UUID NOT NULL, -- References auth.users(id)
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    skill_level skill_level_enum NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

CREATE TABLE bookmarks (
    user_id UUID NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, question_id)
);

CREATE TABLE user_progress (
    user_id UUID NOT NULL,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    status progress_status_enum NOT NULL DEFAULT 'not_started',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, question_id)
);

CREATE TABLE prep_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    total_days INTEGER NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE prep_plan_days (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES prep_plans(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    target_completion_pct FLOAT NOT NULL,
    UNIQUE(plan_id, day_number)
);

CREATE TABLE prep_plan_day_topics (
    plan_day_id UUID REFERENCES prep_plan_days(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (plan_day_id, topic_id)
);

-- Indexes for frequent lookups
CREATE INDEX idx_raw_reports_lookup ON raw_reports(company_id, role_id, round_id, cycle_id);
CREATE INDEX idx_topic_scores_lookup ON topic_scores(company_id, role_id, round_id, cycle_id);
CREATE INDEX idx_question_scores_lookup ON question_scores(company_id, role_id, cycle_id);
CREATE INDEX idx_difficulty_dist_lookup ON difficulty_distributions(company_id, role_id, round_id, cycle_id);

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
