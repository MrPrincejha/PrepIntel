import os
import urllib.request
import json

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

req = urllib.request.Request(f"{url}/rest/v1/")
req.add_header("apikey", key)
req.add_header("Authorization", f"Bearer {key}")

try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print([k for k in data['definitions'].keys()])
except Exception as e:
    print("Error fetching schema:", e)
