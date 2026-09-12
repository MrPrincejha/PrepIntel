import os

main_path = r"e:\prepIntel\prepintel-engine\main.py"
with open(main_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

# Replace fetch_raw_reports
old_fetch = """def fetch_raw_reports(company: str, role: str) -> List[Dict]:
    if not sb: return []
    # Fetch reports matching company (case insensitive via ilike)
    try:
        res = sb.table("raw_reports").select("*").ilike("company", f"%{company}%").execute()
        return res.data if res.data else []
    except Exception as e:
        print(f"Error fetching reports: {e}")
        return []"""

new_fetch = """def resolve_canonical_ids(company_slug: str, role_slug: str = None) -> tuple:
    if not sb: return None, None
    c_id, r_id = None, None
    try:
        c_res = sb.table("companies").select("id").eq("slug", company_slug.lower()).execute()
        if c_res.data: c_id = c_res.data[0]["id"]
        
        if role_slug:
            r_res = sb.table("roles").select("id").eq("slug", role_slug.lower()).execute()
            if r_res.data: r_id = r_res.data[0]["id"]
    except Exception as e:
        print(f"Error resolving IDs: {e}")
    return c_id, r_id

def fetch_raw_reports(company: str, role: str = None) -> List[Dict]:
    if not sb: return []
    
    # 1. Resolve Slugs to canonical UUIDs
    c_id, r_id = resolve_canonical_ids(company, role)
    if not c_id:
        # If company doesn't exist in our canonical DB, return no evidence
        return []
        
    # 2. Query using explicit UUID foreign keys
    try:
        query = sb.table("raw_reports").select("*").eq("company_id", c_id)
        if r_id:
            query = query.eq("role_id", r_id)
        res = query.execute()
        return res.data if res.data else []
    except Exception as e:
        print(f"Error fetching reports: {e}")
        return []"""

m_content = m_content.replace(old_fetch, new_fetch)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(m_content)
