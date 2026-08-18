import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const UI_JUNK_PATTERNS = [
  /^search topics, questions/i,
  /^company:/i,
  /^role:/i,
  /^year:/i,
  /^prepintel$/i,
  /^overview$/i,
  /^questions$/i,
  /^roadmap$/i,
  /^reports$/i,
  /^bookmarks$/i,
  /^progress$/i,
  /^analytics$/i,
  /^admin queue$/i,
  /^\d+\s*issues$/i,
  /^questions explorer$/i,
  /^personalize for me$/i,
  /^all difficulties$/i,
  /^all topics$/i,
  /^bookmarked$/i,
  /^no questions found/i,
  /^[a-z\s]+-\s*sde\s*intern/i // e.g. "Google - SDE Intern - 2025"
];

export function cleanReportText(raw: string): string {
  if (!raw) return "";
  
  // 1. Remove <think> blocks safely
  let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // 2. Remove isolated markdown code block markers
  text = text.replace(/^```[a-zA-Z]*\s*$/gm, '');
  
  // 3. Rule-based deduplication and UI junk filtering
  const lines = text.split('\n');
  const seen = new Set<string>();
  const cleaned: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if (!trimmed) {
      cleaned.push(line);
      continue;
    }

    // Filter out PrepIntel UI elements if they were accidentally screenshot
    const isJunk = UI_JUNK_PATTERNS.some(pattern => pattern.test(trimmed));
    if (isJunk) continue;
    
    // Always keep short lines (like variable values or braces) without deduplicating
    if (trimmed.length < 15) {
      cleaned.push(line);
      continue;
    }
    
    // For longer lines, check if we've seen it.
    // Normalize by lowercasing and removing punctuation to catch slight OCR spelling errors
    const normalized = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (!seen.has(normalized)) {
      seen.add(normalized);
      cleaned.push(line);
    }
  }
  
  // 4. Clean up multiple empty lines
  text = cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  
  return text;
}
