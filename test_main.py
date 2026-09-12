import os
from supabase import create_client
import sys

sys.path.append(r"e:\prepIntel\prepintel-engine")
import main

main.sb = create_client(os.environ.get("NEXT_PUBLIC_SUPABASE_URL"), os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
print(main.fetch_raw_reports("amazon"))
