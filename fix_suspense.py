import os

path = r"e:\prepIntel\prepintel\src\app\(public)\questions\page.tsx"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Rename the main component
content = content.replace("export default function QuestionsPage() {", "function QuestionsPageContent() {")

# Add the Suspense wrapper at the bottom
wrapper = """
import { Suspense } from 'react';

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white/50">Loading questions...</div>}>
      <QuestionsPageContent />
    </Suspense>
  );
}
"""
content = content + wrapper

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
