import os

questions_path = r"e:\prepIntel\prepintel\src\app\(app)\questions\page.tsx"
with open(questions_path, 'r', encoding='utf-8') as f:
    q_content = f.read()

# Replace read hooks
old_read_hook = """    const storedBookmarks = localStorage.getItem(`prepintel_bookmarks_${user.id}`);
    if (storedBookmarks) {
      try { setBookmarks(new Set(JSON.parse(storedBookmarks))); } catch (e) {}
    }
    const storedProgress = localStorage.getItem(`prepintel_progress_${user.id}`);
    if (storedProgress) {
      try { setProgress(JSON.parse(storedProgress)); } catch (e) {}
    }"""

new_read_hook = """    async function loadUserData() {
      const { data: bData } = await supabase.from('bookmarks').select('question_id').eq('user_id', user.id);
      if (bData) setBookmarks(new Set(bData.map(b => b.question_id)));
      
      const { data: pData } = await supabase.from('user_progress').select('question_id, status').eq('user_id', user.id);
      if (pData) {
        const pMap = {};
        pData.forEach(p => pMap[p.question_id] = p.status);
        setProgress(pMap);
      }
    }
    loadUserData();"""
q_content = q_content.replace(old_read_hook, new_read_hook)

# Replace toggleBookmark
old_bookmark = """  const toggleBookmark = async (qId: string) => {
    if (!user) return alert("Please sign in to bookmark questions.");
    const newBookmarks = new Set(bookmarks);
    if (newBookmarks.has(qId)) {
      newBookmarks.delete(qId);
    } else {
      newBookmarks.add(qId);
    }
    setBookmarks(newBookmarks);
    localStorage.setItem(`prepintel_bookmarks_${user.id}`, JSON.stringify(Array.from(newBookmarks)));
  };"""

new_bookmark = """  const toggleBookmark = async (qId: string) => {
    if (!user) return alert("Please sign in to bookmark questions.");
    const newBookmarks = new Set(bookmarks);
    const isRemoving = newBookmarks.has(qId);
    if (isRemoving) {
      newBookmarks.delete(qId);
      await supabase.from('bookmarks').delete().match({ user_id: user.id, question_id: qId });
    } else {
      newBookmarks.add(qId);
      await supabase.from('bookmarks').insert({ user_id: user.id, question_id: qId });
    }
    setBookmarks(newBookmarks);
  };"""
q_content = q_content.replace(old_bookmark, new_bookmark)

# Replace progress
old_progress = """  const setQuestionProgress = async (qId: string, status: string) => {
    if (!user) return alert("Please sign in to track progress.");
    const newProgress = { ...progress, [qId]: status };
    setProgress(newProgress);
    localStorage.setItem(`prepintel_progress_${user.id}`, JSON.stringify(newProgress));
  };"""

new_progress = """  const setQuestionProgress = async (qId: string, status: string) => {
    if (!user) return alert("Please sign in to track progress.");
    const newProgress = { ...progress, [qId]: status };
    setProgress(newProgress);
    await supabase.from('user_progress').upsert({ user_id: user.id, question_id: qId, status: status }, { onConflict: 'user_id,question_id' });
  };"""
q_content = q_content.replace(old_progress, new_progress)

# Write back
with open(questions_path, 'w', encoding='utf-8') as f:
    f.write(q_content)
    
print("Updated questions/page.tsx")
