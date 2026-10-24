import os
from supabase import create_client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
sb = create_client(url, key)

res = sb.table("questions").select("*").limit(5).execute()
print("Questions in DB:", len(res.data), res.data)
