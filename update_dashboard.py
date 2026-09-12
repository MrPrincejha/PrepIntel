import os

dash_path = r"e:\prepIntel\prepintel\src\app\(app)\dashboard\page.tsx"
with open(dash_path, 'r', encoding='utf-8') as f:
    d_content = f.read()

old_read1 = """    const storedSkills = localStorage.getItem("prepintel_skill_profile");
    if (storedSkills) {
      try { setSkillProfile(JSON.parse(storedSkills)); } catch (e) {}
    }"""
new_read1 = """    supabase.auth.getSession().then(async ({ data: { session } }) => {
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
d_content = d_content.replace(old_read1, new_read1)

old_read2 = """        const storedSkills = localStorage.getItem("prepintel_skill_profile");
        const sp = storedSkills ? JSON.parse(storedSkills) : null;"""
new_read2 = """        // Fetch user skill profile directly to pass to backend plan generator
        let sp = null;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: sData } = await supabase.from('user_skill_profile').select('topic_id, skill_level').eq('user_id', session.user.id);
          if (sData) {
            sp = {};
            sData.forEach(s => sp[s.topic_id] = s.skill_level);
          }
        }"""
d_content = d_content.replace(old_read2, new_read2)

with open(dash_path, 'w', encoding='utf-8') as f:
    f.write(d_content)
