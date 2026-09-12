-- Core Canonical Tables
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT
);

CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.recruitment_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS public.rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- Ensure raw_reports has the correct foreign keys
ALTER TABLE public.raw_reports 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS cycle_id UUID REFERENCES public.recruitment_cycles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS round_id UUID REFERENCES public.rounds(id) ON DELETE CASCADE;

-- Insert Base Canonical Data
INSERT INTO public.companies (name, slug, category) VALUES 
('Amazon', 'amazon', 'FAANG'),
('Google', 'google', 'FAANG'),
('Microsoft', 'microsoft', 'FAANG')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.roles (name, slug) VALUES 
('Software Development Engineer 1', 'sde-1'),
('SDE Intern', 'sde-intern')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.recruitment_cycles (label) VALUES 
('2024'), ('2025'), ('2026')
ON CONFLICT (label) DO NOTHING;

-- Data Migration: Backfill existing raw_reports with canonical UUIDs
UPDATE public.raw_reports r
SET company_id = c.id
FROM public.companies c
WHERE LOWER(r.company) = c.slug;

UPDATE public.raw_reports r
SET role_id = rl.id
FROM public.roles rl
WHERE LOWER(r.role) = rl.slug;

-- Grant permissions so the API can see them
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT SELECT ON public.roles TO anon, authenticated;
GRANT SELECT ON public.recruitment_cycles TO anon, authenticated;
GRANT SELECT ON public.rounds TO anon, authenticated;
