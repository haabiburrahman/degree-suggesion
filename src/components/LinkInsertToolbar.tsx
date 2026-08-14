import React, { useState } from 'react';
import { Link, Check, X, Globe, Type } from 'lucide-react';

interface LinkInsertToolbarProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  value?: string;
  onChange?: (newValue: string) => void;
  onInsertLink?: (formattedLinkText: string) => void;
}

export const LinkInsertToolbar: React.FC<LinkInsertToolbarProps> = ({
  textareaRef,
  value = '',
  onChange,
  onInsertLink,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  const handleOpenModal = () => {
    let selectedText = '';
    let range: { start: number; end: number } | null = null;

    if (textareaRef?.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== undefined && end !== undefined && start !== end) {
        selectedText = textarea.value.substring(start, end);
        range = { start, end };
      }
    }

    setSelectionRange(range);
    setLinkTitle(selectedText);
    setIsOpen(true);
  };

  const handleInsert = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!linkUrl.trim()) return;

    let formattedUrl = linkUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const title = linkTitle.trim() || 'ওয়েবসাইট লিংক';
    const markdownLink = `[${title}](${formattedUrl})`;

    if (selectionRange && textareaRef?.current && onChange && value !== undefined) {
      const before = value.substring(0, selectionRange.start);
      const after = value.substring(selectionRange.end);
      const updatedValue = `${before}${markdownLink}${after}`;
      onChange(updatedValue);

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = selectionRange.start + markdownLink.length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 50);
    } else if (onChange && value !== undefined) {
      onChange(value + (value ? ' ' : '') + markdownLink);
    } else if (onInsertLink) {
      onInsertLink(` ${markdownLink} `);
    }

    // Reset and close
    setLinkTitle('');
    setLinkUrl('');
    setSelectionRange(null);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInsert();
    }
  };

  return (
    <div className="space-y-2 my-1">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleOpenModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 rounded-lg text-xs font-bold transition shadow-2xs"
        >
          <Link className="w-3.5 h-3.5 text-blue-700" />
          <span>🔗 লেখা সিলেক্ট করে লিংক যোগ করুন</span>
        </button>

        <span className="text-[11px] text-slate-500 font-body">
          *টেক্সটবক্স থেকে লেখা সিলেক্ট করে এই বাটনে চাপলে সেই লেখার সাথে লিংক জুড়ে যাবে
        </span>
      </div>

      {/* Insert Modal / Popover */}
      {isOpen && (
        <div className="p-3.5 bg-blue-50/95 border-2 border-blue-400 rounded-xl space-y-3 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between pb-1.5 border-b border-blue-200">
            <h5 className="text-xs font-bold text-blue-950 font-heading flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-700" />
              {selectionRange ? 'সিলেক্ট করা লেখার সাথে লিংক যুক্ত করুন' : 'নতুন লেখার সাথে লিংক যুক্ত করুন'}
            </h5>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-800 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 font-heading block mb-1 flex items-center gap-1">
                  <Type className="w-3.5 h-3.5 text-blue-600" />
                  যে লেখাটিতে লিংক দেখাবে (Link Text):
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: নোটিশ ডাউনলোড / ওয়েবসাইট দেখুন"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 font-heading block mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  ওয়েবসাইট এড্রেস (Target URL):
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-200/80">
              <p className="text-[10px] text-slate-600 font-body">
                {selectionRange
                  ? `✓ "${linkTitle}" লেখাটির সাথে লিংক যুক্ত হবে`
                  : '✓ নতুন লিংক ফরম্যাটে টেক্সট যুক্ত হবে'}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={() => handleInsert()}
                  className="px-3.5 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-bold flex items-center gap-1 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  লিংক কনফার্ম করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-[11px] text-slate-600 bg-amber-50/80 border border-amber-200 p-2 rounded-lg leading-relaxed flex items-start gap-1.5">
        <span className="shrink-0">💡</span>
        <span>
          <strong>পদ্ধতি:</strong> নিচে লেখার বক্সে যেকোনো শব্দ বা বাক্য সিলেক্ট (Highlight) করুন, তারপর ওপরের <strong>"🔗 লেখা সিলেক্ট করে লিংক যোগ করুন"</strong> বাটনে চাপ দিন এবং ওয়েবসাইটের লিঙ্কটি দিয়ে দিন। লেখাটিতে সুন্দর নীল ক্লিকেবল লিংক যুক্ত হয়ে যাবে।
        </span>
      </div>
    </div>
  );
};
