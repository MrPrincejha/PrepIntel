import os
import re
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(r"e:\prepIntel\prepintel-engine\.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
sb = create_client(url, key)

def slugify(text: str) -> str:
    s = re.sub(r'[^\w\s-]', '', text.lower()).strip()
    return re.sub(r'[-\s]+', '-', s)[:80]

print("Fetching raw reports...")
res = sb.table("raw_reports").select("id, company, role, raw_text").execute()
reports = res.data or []
print(f"Loaded {len(reports)} raw reports.")

existing_slugs = set()
try:
    q_res = sb.table("questions").select("slug").execute()
    existing_slugs = {row["slug"] for row in q_res.data if row.get("slug")}
except Exception as e:
    print("Error fetching existing questions:", e)

questions_to_insert = []
seen_titles = set()

for r in reports:
    company = r.get("company", "Tech")
    raw = str(r.get("raw_text", ""))
    if len(raw.strip()) < 30:
        continue
        
    chunks = re.split(r'\n(?=#{1,4}\s*\d+\.\s|#{1,4}\s*(?:Q|Question|Problem)\s*\d+|(?:\*\*|)Question\s*\d+(?:\*\*|)\s*[:\-])', raw, flags=re.IGNORECASE)
    
    for i, chunk in enumerate(chunks):
        text = chunk.strip()
        text_lower = text.lower()
        if len(text) < 40 or "write the complete problem statement" in text_lower or "[question title]" in text_lower:
            continue
            
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if not lines: continue
        
        first_line = lines[0]
        header_match = re.match(r'^(?:#{1,4}\s*)?(?:\d+\.\s+|(?:Q|Question|Problem)\s*\d+\s*[:\-\.]?\s*|\*\*(?:Q|Question)\s*\d+\*\*\s*[:\-\.]?\s*)(.*)', first_line, re.IGNORECASE)
        
        title = ""
        if header_match and len(header_match.group(1).strip()) > 3:
            raw_h = header_match.group(1).strip().replace("*", "").replace("#", "").strip()
            if not any(raw_h.lower().startswith(p) or p in raw_h.lower() for p in ["[question", "question title", "your solution"]):
                title = raw_h
                
        if not title:
            for line in lines:
                clean_line = line.strip().replace("#", "").replace("*", "").replace("-", "").strip()
                if 10 < len(clean_line) < 60 and not clean_line.lower().startswith(("year:", "round:", "company:", "note:")):
                    title = clean_line
                    break
                    
        if not title or title.lower() in seen_titles:
            continue
            
        seen_titles.add(title.lower())
        
        base_slug = slugify(f"{company}-{title}")
        slug = base_slug
        counter = 1
        while slug in existing_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1
        existing_slugs.add(slug)
        
        # Difficulty
        if "hard" in text_lower or len(text) > 1200:
            diff = "Hard"
            est_time = 90
        elif "easy" in text_lower or len(text) < 400:
            diff = "Easy"
            est_time = 20
        else:
            diff = "Medium"
            est_time = 45
            
        questions_to_insert.append({
            "canonical_title": title[:100],
            "slug": slug,
            "difficulty_label": diff,
            "estimated_time_minutes": est_time
        })

print(f"Extracted {len(questions_to_insert)} unique questions ready to insert.")

# Batch insert in chunks of 50
inserted_count = 0
for i in range(0, len(questions_to_insert), 50):
    batch = questions_to_insert[i:i+50]
    try:
        sb.table("questions").insert(batch).execute()
        inserted_count += len(batch)
        print(f"Inserted batch {i//50 + 1} ({len(batch)} questions). Total: {inserted_count}")
    except Exception as e:
        print(f"Batch {i//50 + 1} failed: {e}")

print(f"Done! Successfully populated {inserted_count} questions into public.questions.")
