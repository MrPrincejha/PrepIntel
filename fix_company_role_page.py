import os

path = r"e:\prepIntel\prepintel\src\app\(public)\interview-questions\[company]\[role]\page.tsx"
if os.path.exists(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    content = content.replace('difficulty: 1', 'difficulty: "Easy"')
    content = content.replace('difficulty: 2', 'difficulty: "Medium"')
    content = content.replace('difficulty: 3', 'difficulty: "Hard"')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
