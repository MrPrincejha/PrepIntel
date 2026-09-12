# Architecture Audit

## 1. Overview
PrepIntel currently consists of a Next.js (App Router) frontend deployed on Vercel and a flat-structured Python/FastAPI backend (`prepintel-engine`) intended for Render deployment. The source of truth for auth is Supabase, while data is somewhat split between actual Supabase database persistence and local cache / mock scripts.

## 2. Dependencies & Subsystems

**Frontend (Next.js)**
- **UI Framework:** Next.js 15, React 19, Tailwind CSS v4, Framer Motion
- **Data Fetching:** Custom `useCachedApi` hook wrapping `fetch`.
- **Authentication:** Supabase SSR auth (Magic Link + Password).
- **Public vs Private Boundary:** `AuthGuard` handles private routes. Some public directories (`/interview-questions`) have been separated.
- **Analytics Display:** Recharts (Radar, Line, Pie).

**Backend (Python/FastAPI - prepintel-engine)**
- **Framework:** FastAPI, Pydantic, Supabase Python Client.
- **Data Ingestion:** `github_scraper.py`, `ocr.py`, `ingestion.py`.
- **Analytics Pipeline:** `bayesian.py`, `weighting.py`, `dedup.py`, `trend.py`, `scoring.py`.
- **Simulation/Mocking:** `batch_job.py` generates fake data to run through the pipeline.
- **Issues:** The project structure is flat. It mixes endpoints, business logic, and mock data generation.

## 3. Discrepancies & Violations Identified

### Rule 1: Never fabricate data
- `batch_job.py` uses `generate_synthetic_reports(n=50)` and calculates scores on fake data.
- The Next.js frontend has hardcoded mock fallback questions in `/interview-questions/[company]/page.tsx` for AdSense survival when the backend is offline.
- `main.py` endpoints generate randomized trend lines/statistics directly in the API handlers if DB calls fail or don't return enough data.

### Rule 2: Database is the source of truth
- Frontend currently relies on `localStorage` for `bookmarks`, `progress`, and `skill_profile` in `dashboard/page.tsx` and `questions/page.tsx`. This violates the prompt's explicit instruction to use PostgreSQL/Supabase as the canonical source.

### Rule 3: Never trust client identity
- The current API endpoints (if any receive `user_id`) likely don't properly verify Supabase JWTs server-side in Python. (Needs deeper inspection in Phase 3).

### Schema & Data Model Mismatches
- Frontend components mix the use of `company` (name) vs `company_id`.
- The frontend expects `title` for questions, but some legacy scripts expect `canonical_title`.
- There is no clean `companies -> roles -> recruitment_cycles -> rounds` canonical hierarchy in the database schema.

### Security & Deployment
- `main_backup.py` is committed to the repository (dead/unsafe code).
- Missing structured logging, comprehensive rate limiting, and robust error handling in the API.

## 4. Phase 1 Conclusion
The repository requires significant architectural realignment to meet production standards.
The most pressing needs are:
1. Stripping all fake data generators and mock fallbacks.
2. Persisting `bookmarks`, `progress`, and `skill_profile` to Supabase instead of `localStorage`.
3. Refactoring the Python backend into a structured modular architecture (`api/`, `domain/`, `services/`, etc.).
4. Validating and strictly enforcing the Supabase JWT auth on the Python backend.
