# PrepIntel 🚀

PrepIntel is an advanced, data-driven interview preparation platform designed to democratize technical recruiting. It leverages real-world interview reports and a custom Bayesian analytics engine to calculate personalized skill-gap scores. Instead of generic study plans, PrepIntel dynamically adjusts its roadmaps to focus candidates on the highest-yield topics, maximizing their probability of passing technical assessments.

## ✨ Key Features

- **Bayesian Skill-Gap Analytics:** A custom backend engine mathematically evaluates your topic proficiency to highlight specific weaknesses.
- **Personalized Roadmaps:** Generate custom study plans based on target companies, roles, and interview cycles.
- **Real-World Questions:** Practice with authenticated interview questions scraped and curated from recent real-world assessments.
- **Progress Tracking & Bookmarks:** Track your mastery (`not_started`, `attempted`, `solved`) and save high-priority questions.
- **Public SEO Directories:** Fully indexed, server-side rendered public directories of top company interview questions (Amazon, Google, etc.).
- **Monetization:** Seamlessly integrated Google AdSense with manual slot placements designed around Next.js App Router.

## 🛠️ Tech Stack

- **Frontend:** [Next.js](https://nextjs.org/) (App Router), React 19
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/), Framer Motion, Shadcn UI / Base UI
- **Charts/Analytics:** [Recharts](https://recharts.org/)
- **Authentication & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Row-Level Security, Magic Link + Password Auth)
- **Backend API:** Python (Deployed on Render)
- **Hosting:** Vercel

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js 20+ installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MrPrincejha/PrepIntel.git
   cd prepintel
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory and add the following keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Optional: Point this to your live Render backend, defaults to localhost:8000
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📁 Project Structure

- `/src/app/(app)`: Authenticated dashboard routes (Questions, Analytics, Roadmap, Bookmarks).
- `/src/app/(public)`: Public-facing SEO pages and company question directories.
- `/src/app/login`: Dual-mode authentication (Magic Link + Password).
- `/src/components/core`: Reusable UI components (GlassPanels, GradientButtons, AdSense wrappers).
- `/src/lib`: Utilities, Supabase clients, and custom data-fetching hooks (`useCachedApi`).

## 🛡️ Security
This project uses Supabase Row-Level Security (RLS) to ensure that users can only access and modify their own progress and bookmarks. Raw reports are protected and handled securely by the backend engine using `service_role` keys.
