import React from 'react';

/** Renders the small Markdown subset the coach uses: **bold**, "- " / "• " / "* " bullets and line breaks. */
export const RichText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        const bullet = line.match(/^\s*(?:[-•*]|\d+\.)\s+(.*)$/);
        const body = renderBold(bullet ? bullet[1] : line.replace(/^#+\s*/, ''));
        if (bullet) {
          return (
            <div key={i} className="flex gap-2 pl-1">
              <span aria-hidden="true">•</span>
              <span>{body}</span>
            </div>
          );
        }
        return line.trim() === '' ? <div key={i} className="h-2" /> : <div key={i}>{body}</div>;
      })}
    </>
  );
};

function renderBold(line: string): React.ReactNode[] {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}
