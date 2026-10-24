import os
import sys
sys.path.append(r"e:\prepIntel\prepintel-engine")
import main
from supabase import create_client
main.sb = create_client(os.environ.get("NEXT_PUBLIC_SUPABASE_URL"), os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
qs = main.get_questions("amazon", limit=10)
for q in qs:
    print(f"ID: {q['id']} | Title: {q['title']}")
