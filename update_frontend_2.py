import os

questions_path = r"e:\prepIntel\prepintel\src\app\(app)\questions\page.tsx"
with open(questions_path, 'r', encoding='utf-8') as f:
    q_content = f.read()

old_skill_read = """    const storedSkills = localStorage.getItem("prepintel_skill_profile");
    if (storedSkills) {
      try { setSkillProfile(JSON.parse(storedSkills)); } catch (e) {}
    }"""

new_skill_read = """    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      if (u) {
        const { data: sData } = await supabase.from('user_skill_profile').select('topic_id, skill_level').eq('user_id', u.id);
        if (sData) {
          const sMap = {};
          sData.forEach(s => sMap[s.topic_id] = s.skill_level);
          setSkillProfile(sMap);
        }
      }
    });"""
q_content = q_content.replace(old_skill_read, new_skill_read)

with open(questions_path, 'w', encoding='utf-8') as f:
    f.write(q_content)
