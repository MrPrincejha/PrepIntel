import os

analytics_path = r"e:\prepIntel\prepintel\src\app\(app)\analytics\page.tsx"
with open(analytics_path, 'r', encoding='utf-8') as f:
    a_content = f.read()

# I apparently messed up the import insertion in analytics page.
# It should be at the top level.
if "import { createClient } from" not in a_content:
    a_content = 'import { createClient } from "@/lib/supabase/client";\n' + a_content

# Fix TS any types for object indexing in maps
a_content = a_content.replace("const sMap = {};", "const sMap: Record<string, string> = {};")
with open(analytics_path, 'w', encoding='utf-8') as f:
    f.write(a_content)


dash_path = r"e:\prepIntel\prepintel\src\app\(app)\dashboard\page.tsx"
with open(dash_path, 'r', encoding='utf-8') as f:
    d_content = f.read()

d_content = d_content.replace("const sMap = {};", "const sMap: Record<string, string> = {};")
d_content = d_content.replace("sp = {};", "sp: Record<string, string> = {};")
# actually for sp it was `let sp = null; ... sp = {};` so I should do:
d_content = d_content.replace("let sp = null;", "let sp: Record<string, string> | null = null;")
with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(d_content)


q_path = r"e:\prepIntel\prepintel\src\app\(app)\questions\page.tsx"
with open(q_path, 'r', encoding='utf-8') as f:
    q_content = f.read()

q_content = q_content.replace("const sMap = {};", "const sMap: Record<string, string> = {};")
q_content = q_content.replace("const pMap = {};", "const pMap: Record<string, string> = {};")
with open(q_path, 'w', encoding='utf-8') as f:
    f.write(q_content)
