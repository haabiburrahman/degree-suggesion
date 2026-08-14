import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  X, 
  Check, 
  ArrowRight, 
  FileText, 
  Image as ImageIcon, 
  FileDown, 
  BookOpen, 
  Copy, 
  Sparkles,
  Plus
} from 'lucide-react';
import { Suggestion, Subject } from '../types';

interface QuestionPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSubjectId?: string;
  allSuggestions: Suggestion[];
  subjects: Subject[];
  onSelectQuestion: (
    question: Suggestion, 
    mode: 'load_all' | 'append_text' | 'quick_duplicate'
  ) => void;
}

export const QuestionPickerModal: React.FC<QuestionPickerModalProps> = ({
  isOpen,
  onClose,
  currentSubjectId,
  allSuggestions,
  subjects,
  onSelectQuestion,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [scope, setScope] = useState<'current_subject' | 'all'>(
    currentSubjectId ? 'current_subject' : 'all'
  );

  if (!isOpen) return null;

  // Filter only questions (or items having content)
  const questionPool = allSuggestions.filter(s => {
    // Treat items marked as 'question' or with question-like title
    return s.contentType === 'question' || !s.contentType;
  });

  const filteredQuestions = questionPool.filter(q => {
    if (scope === 'current_subject' && currentSubjectId) {
      if (q.subjectId !== currentSubjectId) return false;
    }

    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    const matchesTitle = q.title.toLowerCase().includes(term);
    const matchesContent = q.content.toLowerCase().includes(term);
    const subjectName = subjects.find(s => s.id === q.subjectId)?.name.toLowerCase() || '';
    const matchesSubject = subjectName.includes(term);

    return matchesTitle || matchesContent || matchesSubject;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF6EC] border-2 border-[#1B2A4A] rounded-2xl max-w-3xl w-full p-5 sm:p-7 space-y-4 shadow-2xl relative my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-black rounded-lg transition hover:bg-slate-200"
          title="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#1B2A4A] text-[#F2A93B] rounded-full text-xs font-bold font-heading">
            <Sparkles className="w-3.5 h-3.5" />
            পূর্বের প্রশ্ন থেকে সাজেশনে যুক্ত করুন
          </div>
          <h3 className="font-heading font-extrabold text-xl text-[#1B2A4A]">
            পূর্বে যুক্ত করা প্রশ্ন নির্বাচন করুন
          </h3>
          <p className="text-xs text-slate-600 font-body">
            আগে সংরক্ষিত যে কোনো প্রশ্ন বা বিগত বছরের প্রশ্নপত্র পছন্দ করে এক ক্লিকেই সাজেশনে রূপান্তর অথবা লোড করতে পারেন।
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="space-y-2 pt-1 border-t border-[#D8CEB7]">
          <div className="flex items-center gap-2 flex-wrap justify-between">
            {currentSubjectId && (
              <div className="flex items-center gap-1.5 bg-[#EAE2CE] p-1 rounded-xl text-xs font-bold font-heading">
                <button
                  type="button"
                  onClick={() => setScope('current_subject')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    scope === 'current_subject'
                      ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-2xs'
                      : 'text-slate-700 hover:text-[#1B2A4A]'
                  }`}
                >
                  এই বিষয়ের প্রশ্নসমূহ
                </button>
                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`px-3 py-1.5 rounded-lg transition ${
                    scope === 'all'
                      ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-2xs'
                      : 'text-slate-700 hover:text-[#1B2A4A]'
                  }`}
                >
                  সকল বিষয়ের প্রশ্ন
                </button>
              </div>
            )}

            <span className="text-xs font-bold text-slate-500 font-heading">
              পাওয়া গেছে: {filteredQuestions.length}টি প্রশ্ন
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="প্রশ্নের নাম, সাল বা লেখার অংশ দিয়ে সার্চ করুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none font-body"
              autoFocus
            />
          </div>
        </div>

        {/* Questions List */}
        <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center bg-white/70 rounded-xl border border-dashed border-[#D8CEB7] space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600 font-heading">
                কোনো প্রশ্ন পাওয়া যায়নি
              </p>
              <p className="text-[11px] text-slate-500">
                {searchTerm 
                  ? 'আপনার সার্চ অনুযায়ী কোনো প্রশ্ন মেলেনি।' 
                  : 'পূর্বে কোনো প্রশ্ন সংরক্ষণ করা হয়নি।'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const subj = subjects.find(s => s.id === q.subjectId);
              const hasImages = q.imageUrls && q.imageUrls.length > 0;
              const hasPdf = Boolean(q.pdfUrl);

              return (
                <div
                  key={q.id}
                  className="p-4 bg-white border border-[#D8CEB7] hover:border-[#1B2A4A] rounded-xl space-y-2.5 transition-all shadow-2xs hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {subj && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FAF6EC] text-[#1B2A4A] px-2 py-0.5 rounded-md border border-[#D8CEB7]">
                            <BookOpen className="w-3 h-3 text-[#F2A93B]" />
                            {subj.name}
                          </span>
                        )}
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                          {q.contentType === 'question' ? 'প্রশ্ন' : 'সংরক্ষিত আইটেম'}
                        </span>
                        {hasImages && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                            <ImageIcon className="w-3 h-3 text-slate-500" />
                            {q.imageUrls.length}টি ছবি
                          </span>
                        )}
                        {hasPdf && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 font-bold">
                            <FileDown className="w-3 h-3 text-slate-500" />
                            PDF
                          </span>
                        )}
                      </div>

                      <h4 className="font-heading font-bold text-sm text-[#1B2A4A] leading-snug">
                        {q.title}
                      </h4>
                    </div>
                  </div>

                  {/* Content snippet */}
                  <p className="text-xs text-slate-600 font-body line-clamp-2 leading-relaxed bg-[#FAF6EC]/80 p-2 rounded-lg border border-[#EAE2CE]">
                    {q.content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')}
                  </p>

                  {/* Actions for this question */}
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#EAE2CE] flex-wrap">
                    <button
                      type="button"
                      onClick={() => onSelectQuestion(q, 'append_text')}
                      className="px-3 py-1.5 bg-[#FAF6EC] hover:bg-[#EAE2CE] text-slate-700 rounded-lg text-xs font-bold font-heading border border-[#D8CEB7] flex items-center gap-1.5 transition"
                      title="বর্তমান লেখার শেষে এই প্রশ্নটি যোগ করুন"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      লেখায় যুক্ত করুন
                    </button>

                    <button
                      type="button"
                      onClick={() => onSelectQuestion(q, 'load_all')}
                      className="px-3.5 py-1.5 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] rounded-lg text-xs font-extrabold font-heading shadow-xs flex items-center gap-1.5 transition"
                      title="সাজেশন ফর্মে সম্পূর্ণ প্রশ্নটি লোড করুন"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      সাজেশন ফর্মে লোড করুন &rarr;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2 border-t border-[#D8CEB7] text-[11px] text-slate-500">
          <span>টিপ: প্রশ্ন সিলেক্ট করলে শিরোনাম, উত্তর ও ছবি স্বয়ংক্রিয়ভাবে সাজেশনে যুক্ত হবে।</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs"
          >
            বাতিল
          </button>
        </div>

      </div>
    </div>
  );
};
