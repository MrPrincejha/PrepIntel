import os

paths = [
    r"e:\prepIntel\prepintel\src\app\(app)\bookmarks\page.tsx",
    r"e:\prepIntel\prepintel\src\app\(app)\dashboard\page.tsx",
    r"e:\prepIntel\prepintel\src\app\(app)\progress\page.tsx",
    r"e:\prepIntel\prepintel\src\app\(app)\questions\[id]\page.tsx",
    r"e:\prepIntel\prepintel\src\app\(app)\questions\page.tsx",
    r"e:\prepIntel\prepintel\src\app\(app)\reports\page.tsx",
    r"e:\prepIntel\prepintel\src\app\(app)\roadmap\page.tsx"
]

for p in paths:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8') as f:
            content = f.read()
        content = content.replace('const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api";',
                                  'const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000") + "/api/v1";')
        with open(p, 'w', encoding='utf-8') as f:
            f.write(content)
