import type { JSX } from 'react';

interface MarkdownRendererProps {
  content: string;
  collapsed?: boolean;
  large?: boolean;
}

export function MarkdownRenderer({ content, collapsed = false, large = false }: MarkdownRendererProps) {
  if (!content.trim()) {
    return <p className="text-gray-400 text-sm italic">No content</p>;
  }

  const lines = content.split('\n').filter((l) => l.trim() || l.trim() === '---');

  if (collapsed && lines.length > 0) {
    return <p className="text-sm text-gray-400 truncate">{stripMarkdown(lines[0])}</p>;
  }

  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <RenderLine key={i} line={line} large={large} />
      ))}
    </div>
  );
}

function RenderLine({ line, large }: { line: string; large?: boolean }) {
  const trimmed = line.trim();
  const textClass = large ? 'text-lg leading-7' : 'text-sm leading-snug';

  // Breathing break
  if (trimmed === '---') {
    return (
      <div className="flex items-center gap-2 my-2">
        <span className="text-gray-600 text-xs tracking-widest">· · ·</span>
      </div>
    );
  }

  // Bullet points
  if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
    const text = trimmed.slice(2);
    return (
      <div className={`flex gap-1.5 ${textClass}`}>
        <span className="text-gray-400 shrink-0">•</span>
        <span>{renderInline(text)}</span>
      </div>
    );
  }

  // Headings (for display within a section)
  if (trimmed.startsWith('## ')) {
    return <h3 className={`font-semibold mt-2 ${textClass}`}>{trimmed.slice(3)}</h3>;
  }
  if (trimmed.startsWith('# ')) {
    return <h2 className={`font-bold mt-2 ${textClass}`}>{trimmed.slice(2)}</h2>;
  }

  // Regular text
  return <p className={textClass}>{renderInline(trimmed)}</p>;
}

function renderInline(text: string) {
  // Handle **bold** and *italic*
  const parts: (string | JSX.Element)[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={match.index} className="font-semibold">{match[1]}</strong>);
    } else if (match[2]) {
      parts.push(<em key={match.index}>{match[2]}</em>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

function stripMarkdown(text: string): string {
  return text.replace(/^#+\s+/, '').replace(/\*\*/g, '').replace(/\*/g, '');
}
