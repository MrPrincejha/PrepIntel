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
