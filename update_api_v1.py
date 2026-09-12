import os

main_path = r"e:\prepIntel\prepintel-engine\main.py"
with open(main_path, 'r', encoding='utf-8') as f:
    m_content = f.read()

# Replace endpoint strings
m_content = m_content.replace('@app.get("/api/topics")', '@app.get("/api/v1/topics")')
m_content = m_content.replace('@app.get("/api/difficulty")', '@app.get("/api/v1/difficulty")')
m_content = m_content.replace('@app.get("/api/trend")', '@app.get("/api/v1/trend")')
m_content = m_content.replace('@app.get("/api/questions")', '@app.get("/api/v1/questions")')
m_content = m_content.replace('@app.post("/api/prep-plan")', '@app.post("/api/v1/prep-plan")')
m_content = m_content.replace('@app.post("/api/ingest/screenshot")', '@app.post("/api/v1/ingest/screenshot")')
m_content = m_content.replace('@app.post("/api/ingest/text")', '@app.post("/api/v1/ingest/text")')
m_content = m_content.replace('@app.get("/api/progress/unified")', '@app.get("/api/v1/progress/unified")')

with open(main_path, 'w', encoding='utf-8') as f:
    f.write(m_content)
