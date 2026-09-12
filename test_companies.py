import os
from supabase import create_client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
sb = create_client(url, key)

try:
    res = sb.table("companies").select("*").limit(2).execute()
    print("Companies:", res.data)
except Exception as e:
    print("Error querying companies:", e)
