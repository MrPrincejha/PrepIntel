import os

main_path = r"e:\prepIntel\prepintel-engine\main.py"
with open(main_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

old_diff = """def get_difficulty(company: str, role: str, cycle: str, round_type: str = Query("oa", alias="round")):
    reports = fetch_raw_reports(company, role)
    if not reports:
        return {"easy_pct": 33, "medium_pct": 34, "hard_pct": 33}"""

new_diff = """def get_difficulty(company: str, role: str = None, cycle: str = None, round_type: str = Query("oa", alias="round")):
    reports = fetch_raw_reports(company, role)
    if not reports:
        return {"error": "Insufficient evidence"}"""

m_content = m_content.replace(old_diff, new_diff)

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(m_content)
