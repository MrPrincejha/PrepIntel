import os
import re
import base64
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

def run():
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        return
    sb = create_client(url, key)

    headers = {'Accept': 'application/vnd.github.v3+json'}
    token = os.environ.get("GITHUB_PAT") or os.environ.get("GITHUB_TOKEN")
    if token:
        headers['Authorization'] = f'token {token}'

    tree_url = 'https://api.github.com/repos/atharva7803/Accenture-Previous-Year-Coding-Questions-/git/trees/main?recursive=1'
    try:
        res = requests.get(tree_url, headers=headers)
        tree = res.json().get('tree', [])
    except Exception as e:
        print("Error fetching Accenture tree:", e)
        return

def slugify(text: str) -> str:
    s = re.sub(r'[^\w\s-]', '', text.lower()).strip()
    return re.sub(r'[-\s]+', '-', s)[:80]

    existing_sources = set()
    try:
        r_src = sb.table('raw_reports').select('source').like('source', '%accenture%').execute()
        existing_sources = {row['source'] for row in r_src.data if row.get('source')}
    except Exception as e:
        print("Error fetching sources:", e)

    existing_slugs = set()
    try:
        q_src = sb.table('questions').select('slug').execute()
        existing_slugs = {row['slug'] for row in q_src.data if row.get('slug')}
    except Exception as e:
        print("Error fetching slugs:", e)

    raw_reports_to_insert = []
    questions_to_insert = []

    code_files = [t for t in tree if t['path'].endswith(('.java', '.cpp', '.py'))]
    print(f"Found {len(code_files)} Accenture files.")

    for item in code_files:
        path = item['path']
        filename = path.split('/')[-1].rsplit('.', 1)[0]
        # Convert camelCase to title: e.g. AbsoluteDifference -> Absolute Difference
        title = re.sub(r'([a-z])([A-Z])', r'\1 \2', filename)
        source_id = f"github:atharva7803/Accenture:{path}"
        
        blob = requests.get(item['url'], headers=headers).json()
        if blob.get('encoding') != 'base64':
            continue
            
        content = base64.b64decode(blob['content']).decode('utf-8', errors='ignore')
        
        # Extract problem text from comment or content
        comment_match = re.search(r'/\*(.*?)\*/', content, re.DOTALL)
        if comment_match:
            problem_text = comment_match.group(1).strip()
        else:
            # Check python docstring
            py_match = re.search(r'"""(.*?)"""', content, re.DOTALL)
            if py_match:
                problem_text = py_match.group(1).strip()
            else:
                problem_text = content
                
        if len(problem_text.strip()) < 40:
            continue
            
        # Check if first line of problem statement has a better title
        lines = [l.strip() for l in problem_text.split('\n') if l.strip()]
        if lines and len(lines[0]) < 60 and not lines[0].lower().startswith(('you are given', 'problem statement', 'example', 'input')):
            clean_first = re.sub(r'^[#*\-\s]+', '', lines[0]).strip()
            if len(clean_first) > 4:
                title = clean_first
                
        full_report_text = f"# {title}\n\n**Company:** Accenture\n**Round:** Coding Assessment\n\n{problem_text}"
        
        if source_id not in existing_sources:
            raw_reports_to_insert.append({
                "company": "Accenture",
                "role": "Software Engineer",
                "round": "Coding Assessment",
                "raw_text": full_report_text,
                "status": "pending",
                "source": source_id,
                "source_url": f"https://github.com/atharva7803/Accenture-Previous-Year-Coding-Questions-/blob/main/{path}"
            })
            existing_sources.add(source_id)
            
        slug = slugify(f"accenture-{title}")
        if slug not in existing_slugs:
            existing_slugs.add(slug)
            questions_to_insert.append({
                "canonical_title": title[:100],
                "slug": slug,
                "difficulty_label": "Medium" if len(problem_text) > 600 else "Easy",
                "estimated_time_minutes": 35
            })

    print(f"Prepared {len(raw_reports_to_insert)} raw reports and {len(questions_to_insert)} questions.")

    if raw_reports_to_insert:
        for i in range(0, len(raw_reports_to_insert), 20):
            batch = raw_reports_to_insert[i:i+20]
            sb.table("raw_reports").insert(batch).execute()
        print(f"Inserted {len(raw_reports_to_insert)} Accenture raw reports.")

    if questions_to_insert:
        for i in range(0, len(questions_to_insert), 50):
            batch = questions_to_insert[i:i+50]
            sb.table("questions").insert(batch).execute()
        print(f"Inserted {len(questions_to_insert)} Accenture canonical questions.")

if __name__ == "__main__":
    run()
