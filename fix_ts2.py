import os

dash_path = r"e:\prepIntel\prepintel\src\app\(app)\dashboard\page.tsx"
with open(dash_path, 'r', encoding='utf-8') as f:
    d_content = f.read()

d_content = d_content.replace("sp: Record<string, string> = {};", "sp = {};")
d_content = d_content.replace("sp[s.topic_id] = s.skill_level", "sp![s.topic_id] = s.skill_level")

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(d_content)
