import os

path = r"e:\prepIntel\prepintel\src\app\(app)\analytics\page.tsx"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# find "use client"; and move it to the top
new_lines = []
has_use_client = False
for line in lines:
    if "use client" in line:
        has_use_client = True
    else:
        new_lines.append(line)

if has_use_client:
    new_lines.insert(0, '"use client";\n')

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

