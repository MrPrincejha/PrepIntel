import os
from supabase import create_client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
# Using service role key if available, otherwise anon key
sb = create_client(url, key)

companies = [
    {"name": "Amazon", "slug": "amazon", "category": "FAANG"},
    {"name": "Google", "slug": "google", "category": "FAANG"},
    {"name": "Microsoft", "slug": "microsoft", "category": "FAANG"},
    {"name": "Meta", "slug": "meta", "category": "FAANG"},
    {"name": "Apple", "slug": "apple", "category": "FAANG"}
]

roles = [
    {"name": "Software Development Engineer 1", "slug": "sde-1"},
    {"name": "Software Development Engineer 2", "slug": "sde-2"},
    {"name": "SDE Intern", "slug": "sde-intern"},
    {"name": "Frontend Engineer", "slug": "frontend"},
    {"name": "Data Engineer", "slug": "data-engineer"}
]

cycles = [
    {"year": 2024, "label": "2024"},
    {"year": 2025, "label": "2025"},
    {"year": 2026, "label": "2026"}
]

rounds = [
    {"name": "Online Assessment (OA)"},
    {"name": "Technical Phone Screen"},
    {"name": "Onsite - Data Structures & Algorithms"},
    {"name": "Onsite - System Design"},
    {"name": "Behavioral / Leadership"}
]

def seed():
    print("Seeding companies...")
    for c in companies:
        sb.table("companies").upsert(c, on_conflict="slug").execute()
        
    print("Seeding roles...")
    for r in roles:
        sb.table("roles").upsert(r, on_conflict="slug").execute()
        
    print("Seeding cycles...")
    for c in cycles:
        # No slug constraint right now, so we just insert if not exists (fetch first)
        res = sb.table("recruitment_cycles").select("*").eq("label", c["label"]).execute()
        if not res.data:
            sb.table("recruitment_cycles").insert(c).execute()
            
    print("Seeding rounds...")
    for r in rounds:
        res = sb.table("rounds").select("*").eq("name", r["name"]).execute()
        if not res.data:
            sb.table("rounds").insert(r).execute()
            
    print("Seeding complete.")

if __name__ == "__main__":
    seed()
