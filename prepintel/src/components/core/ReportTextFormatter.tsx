import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export const ReportTextFormatter = ({ text }: { text: string }) => {
  return (
    <div className="text-sm text-white/80 leading-relaxed font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-white mt-8 mb-4 border-b border-white/10 pb-2" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mt-6 mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2" {...props} />,
          p: ({ node, ...props }) => <div className="mb-4 last:mb-0 break-words leading-relaxed" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-1.5 marker:text-primary" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-1.5 marker:text-primary" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1" {...props} />,
          a: ({ node, ...props }) => <a className="text-cyan-400 hover:text-cyan-300 hover:underline underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/50 bg-primary/5 py-2 px-4 rounded-r-lg my-4 italic text-white/70" {...props} />,
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            return !inline ? (
              <div className="relative my-4 group">
                {match && (
                  <div className="absolute top-0 right-0 px-2 py-1 text-[10px] font-mono text-white/40 bg-white/5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity">
                    {match[1]}
                  </div>
                )}
                <pre className="bg-black/50 border border-white/10 p-4 rounded-lg overflow-x-auto text-xs font-mono text-white/90">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-white/10 text-primary-300 font-mono text-xs px-1.5 py-0.5 rounded" {...props}>
                {children}
              </code>
            )
          },
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
              <table className="min-w-full divide-y divide-white/10" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-white/5" {...props} />,
          th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider" {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-3 text-sm border-t border-white/10" {...props} />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};
