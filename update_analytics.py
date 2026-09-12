import os

analytics_path = r"e:\prepIntel\prepintel\src\app\(app)\analytics\page.tsx"
with open(analytics_path, 'r', encoding='utf-8') as f:
    a_content = f.read()

# Add createClient import
if "import { createClient }" not in a_content:
    a_content = a_content.replace('import { useState, useEffect, useMemo } from "react";',
                                  'import { useState, useEffect, useMemo } from "react";\nimport { createClient } from "@/lib/supabase/client";')

# Update states
if "const [user, setUser]" not in a_content:
    a_content = a_content.replace('const [profile, setProfile] = useState<Record<string, string>>({});',
                                  'const [profile, setProfile] = useState<Record<string, string>>({});\n  const [user, setUser] = useState<any>(null);\n  const supabase = createClient();')

# Replace read
old_read = """    const stored = localStorage.getItem("prepintel_skill_profile");
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch(e) {}
    }"""

new_read = """    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        const { data: sData } = await supabase.from('user_skill_profile').select('topic_id, skill_level').eq('user_id', u.id);
        if (sData) {
          const sMap = {};
          sData.forEach(s => sMap[s.topic_id] = s.skill_level);
          setProfile(sMap);
        }
      }
    });"""
a_content = a_content.replace(old_read, new_read)

# Replace write
old_write = """  const handleSave = () => {
    localStorage.setItem("prepintel_skill_profile", JSON.stringify(profile));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setIsEditMode(false);
  };"""

new_write = """  const handleSave = async () => {
    if (!user) return alert("Please sign in to save your profile.");
    
    // Upsert all profile entries to Supabase
    const upserts = Object.entries(profile).map(([topic_id, skill_level]) => ({
      user_id: user.id,
      topic_id,
      skill_level
    }));
    
    if (upserts.length > 0) {
      await supabase.from('user_skill_profile').upsert(upserts, { onConflict: 'user_id,topic_id' });
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setIsEditMode(false);
  };"""
a_content = a_content.replace(old_write, new_write)

with open(analytics_path, 'w', encoding='utf-8') as f:
    f.write(a_content)
