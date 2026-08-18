import React from "react";

export const ReportTextFormatter = ({ text }: { text: string }) => {
  const lines = text.split('\n');
  
  return (
    <div className="text-sm text-white/80 leading-relaxed font-sans">
      {lines.map((line, i) => {
        const isHeader = /QUESTION:\s*\d+/i.test(line) || /GROUP:\s*Coding/i.test(line);
        const isSubHeader = /^(Sample Input|Sample Output|Constraints|Explanations|Input Format|Output Format|Example)/i.test(line);
        
        if (isHeader) {
          return (
            <div key={i} className="mt-6 first:mt-0 mb-3 font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded border border-primary/20 inline-block w-full">
              {line}
            </div>
          );
        }
        
        if (isSubHeader) {
          return (
            <div key={i} className="mt-4 mb-1 font-semibold text-white/90">
              {line}
            </div>
          );
        }
        
        if (!line.trim()) {
           return <div key={i} className="h-2"></div>;
        }
        
        return <div key={i} className="min-h-[1.5rem] break-words">{line}</div>;
      })}
    </div>
  );
};
