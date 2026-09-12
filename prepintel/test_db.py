import os
from supabase import create_client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
sb = create_client(url, key)

res = sb.table('raw_reports').select('*').limit(1).execute()
print("raw_reports:", res.data)
