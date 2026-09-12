import os
import re

page_path = r"e:\prepIntel\prepintel\src\app\page.tsx"
with open(page_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the nav block
nav_pattern = r'<nav.*?</nav>'
content = re.sub(nav_pattern, '', content, flags=re.DOTALL)

# Remove the PublicFooter block
footer_pattern = r'<PublicFooter />'
content = re.sub(footer_pattern, '', content)

# Remove the import for PublicFooter
content = re.sub(r'import { PublicFooter } from "@/components/core/PublicFooter";\n', '', content)

with open(r"e:\prepIntel\prepintel\src\app\(public)\page.tsx", 'w', encoding='utf-8') as f:
    f.write(content)

os.remove(page_path)
