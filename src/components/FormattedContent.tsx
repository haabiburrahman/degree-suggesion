import React from 'react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';

interface FormattedContentProps {
  content: string;
  className?: string;
}

export const FormattedContent: React.FC<FormattedContentProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Regex matches markdown links [text](url) OR raw URLs (https://... or http://... or www....)
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+|www\.[^\s\)]+)\)|(https?:\/\/[^\s\)]+|www\.[^\s\)]+)/g;

  const renderFormattedText = (text: string) => {
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const matchIndex = match.index;

      // Add plain text before match
      if (matchIndex > lastIndex) {
        elements.push(text.slice(lastIndex, matchIndex));
      }

      if (match[1] && match[2]) {
        // Markdown link [text](url)
        const linkText = match[1];
        let linkUrl = match[2];
        if (linkUrl.startsWith('www.')) linkUrl = `https://${linkUrl}`;

        elements.push(
          <a
            key={matchIndex}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-300 font-bold px-2 py-0.5 rounded-md mx-1 inline-flex items-center gap-1 transition-all underline decoration-blue-500 underline-offset-2"
            title={linkUrl}
          >
            <LinkIcon className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span>{linkText}</span>
            <ExternalLink className="w-3 h-3 text-blue-600 shrink-0" />
          </a>
        );
      } else if (match[3]) {
        // Plain URL
        let rawUrl = match[3];
        let hrefUrl = rawUrl;
        if (hrefUrl.startsWith('www.')) hrefUrl = `https://${hrefUrl}`;

        elements.push(
          <a
            key={matchIndex}
            href={hrefUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-800 hover:text-blue-950 bg-blue-50 hover:bg-blue-100 border border-blue-300 font-bold px-2 py-0.5 rounded-md mx-1 inline-flex items-center gap-1 transition-all underline decoration-blue-500 underline-offset-2 max-w-full truncate align-middle"
            title={hrefUrl}
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-700 shrink-0" />
            <span className="truncate">{rawUrl}</span>
          </a>
        );
      }

      lastIndex = pattern.lastIndex;
    }

    // Add remaining plain text
    if (lastIndex < text.length) {
      elements.push(text.slice(lastIndex));
    }

    return elements;
  };

  return (
    <div className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      {renderFormattedText(content)}
    </div>
  );
};
