import os
from supabase import create_client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
sb = create_client(url, key)

try:
    res = sb.table("raw_reports").select("*").limit(1).execute()
    print("Raw reports:", res.data)
except Exception as e:
    print("Error querying raw_reports:", e)
