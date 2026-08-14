import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  X, 
  Check, 
  Star, 
  Plus, 
  Minus, 
  Sparkles, 
  BookOpen, 
  Image as ImageIcon, 
  FileDown, 
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Suggestion, Subject } from '../types';
import { updateSuggestion } from '../services/db';
import { SuggestionSection, SECTIONS_META, getSuggestionSection } from '../utils/sectionHelper';
import { sortSuggestionsBySerial } from '../utils/orderHelper';

interface QuestionBankManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubject: Subject;
  suggestions: Suggestion[];
  onToggleSuccess?: (msg: string) => void;
}

export const isIncludedInActiveSuggestion = (s: Suggestion): boolean => {
  if (typeof s.inSuggestion === 'boolean') {
    return s.inSuggestion;
  }
  return s.contentType !== 'question';
};

export const QuestionBankManagerModal: React.FC<QuestionBankManagerModalProps> = ({
  isOpen,
  onClose,
  selectedSubject,
  suggestions,
  onToggleSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState<'ALL' | SuggestionSection>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Extract all distinct exam years
  const examYears = Array.from(
    new Set(
      suggestions
        .map(s => s.examYear?.trim())
        .filter((y): y is string => Boolean(y))
    )
  ).sort().reverse();

  const filteredItems = sortSuggestionsBySerial(suggestions.filter(item => {
    const itemSec = getSuggestionSection(item);
    const matchesSection = sectionFilter === 'ALL' || itemSec === sectionFilter;

    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.examYear && item.examYear.includes(searchTerm));

    const matchesYear = yearFilter === 'all' || item.examYear === yearFilter;

    return matchesSection && matchesSearch && matchesYear;
  }));

  const activeCount = suggestions.filter(isIncludedInActiveSuggestion).length;
  const totalCount = suggestions.length;

  const handleToggle = async (item: Suggestion, currentlyIn: boolean, importanceLevel: 'high' | 'medium' | 'normal' = 'high') => {
    setUpdatingId(item.id);
    try {
      const nextInSuggestion = !currentlyIn;
      await updateSuggestion(item.id, {
        inSuggestion: nextInSuggestion,
        importance: nextInSuggestion ? (item.importance || importanceLevel) : item.importance,
        contentType: nextInSuggestion ? 'suggestion' : 'question'
      });

      if (onToggleSuccess) {
        onToggleSuccess(
          nextInSuggestion 
            ? `"${item.title.substring(0, 30)}..." চলতি সাজেশনে যুক্ত করা হয়েছে!` 
            : `"${item.title.substring(0, 30)}..." সাজেশন থেকে বাদ দেওয়া হয়েছে!`
        );
      }
    } catch (err: any) {
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetImportance = async (item: Suggestion, importance: 'high' | 'medium' | 'normal') => {
    setUpdatingId(item.id);
    try {
      await updateSuggestion(item.id, {
        inSuggestion: true,
        importance
      });
      if (onToggleSuccess) {
        onToggleSuccess(`গুরুত্ব স্তর "${importance === 'high' ? '৯৯% কমন' : importance === 'medium' ? '৯০% কমন' : 'সাধারণ'}" নির্ধারণ করা হয়েছে!`);
      }
    } catch (err: any) {
      alert('আপডেট ব্যর্থ: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetSection = async (item: Suggestion, sec: SuggestionSection) => {
    setUpdatingId(item.id);
    try {
      await updateSuggestion(item.id, {
        section: sec
      });
      if (onToggleSuccess) {
        onToggleSuccess(`বিভাগ "${SECTIONS_META[sec].name}" নির্ধারণ করা হয়েছে!`);
      }
    } catch (err: any) {
      alert('বিভাগ পরিবর্তন ব্যর্থ: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#FAF6EC] border-2 border-[#1B2A4A] rounded-2xl max-w-4xl w-full p-5 sm:p-7 space-y-4 shadow-2xl relative my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-black rounded-lg transition hover:bg-slate-200"
          title="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#1B2A4A] text-[#F2A93B] rounded-full text-xs font-bold font-heading">
            <BookOpen className="w-3.5 h-3.5" />
            {selectedSubject.name}
          </div>
          <h3 className="font-heading font-extrabold text-xl text-[#1B2A4A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#F2A93B]" />
            প্রশ্নব্যাংক থেকে সাজেশনে প্রশ্ন যুক্ত বা বাদ দিন
          </h3>
          <p className="text-xs text-slate-600 font-body">
            ক বিভাগ, খ বিভাগ ও গ বিভাগের যে কোনো প্রশ্ন এক ক্লিকেই চলতি বছরের চূড়ান্ত সাজেশনে নির্বাচন করুন।
          </p>
        </div>

        {/* Progress & Summary Bar */}
        <div className="p-3.5 bg-white border border-[#D8CEB7] rounded-xl flex items-center justify-between gap-3 flex-wrap shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-bold font-heading text-[#1B2A4A]">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-300">
              চলতি সাজেশনে নির্বাচিত: {activeCount}টি
            </span>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg border border-slate-300">
              মোট প্রশ্নব্যাংক: {totalCount}টি
            </span>
          </div>

          <p className="text-[11px] text-slate-500 font-body">
            প্রতি বছর নতুন পরীক্ষার জন্য সহজেই প্রশ্ন বাছাই করুন।
          </p>
        </div>

        {/* Section Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs font-bold text-[#1B2A4A] font-heading mr-1">বিভাগ ফিল্টার:</span>
          <button
            type="button"
            onClick={() => setSectionFilter('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition font-heading cursor-pointer ${
              sectionFilter === 'ALL'
                ? 'bg-[#1B2A4A] text-[#F2A93B]'
                : 'bg-white text-slate-700 border border-[#D8CEB7]'
            }`}
          >
            সকল বিভাগ
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter('A')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition font-heading cursor-pointer flex items-center gap-1 ${
              sectionFilter === 'A'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-slate-700 border border-[#D8CEB7]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            ক বিভাগ (অতিসংক্ষিপ্ত)
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter('B')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition font-heading cursor-pointer flex items-center gap-1 ${
              sectionFilter === 'B'
                ? 'bg-blue-700 text-white'
                : 'bg-white text-slate-700 border border-[#D8CEB7]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            খ বিভাগ (সংক্ষিপ্ত)
          </button>
          <button
            type="button"
            onClick={() => setSectionFilter('C')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition font-heading cursor-pointer flex items-center gap-1 ${
              sectionFilter === 'C'
                ? 'bg-purple-700 text-white'
                : 'bg-white text-slate-700 border border-[#D8CEB7]'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            গ বিভাগ (রচনামূলক)
          </button>
        </div>

        {/* Search & Year Filters */}
        <div className="space-y-2 pt-1 border-t border-[#D8CEB7]">
          <div className="flex items-center gap-2 flex-wrap justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                type="button"
                onClick={() => setYearFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  yearFilter === 'all'
                    ? 'bg-[#1B2A4A] text-[#F2A93B]'
                    : 'bg-white text-slate-700 border border-[#D8CEB7] hover:bg-slate-50'
                }`}
              >
                সকল সাল
              </button>
              {examYears.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYearFilter(y)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                    yearFilter === y
                      ? 'bg-[#1B2A4A] text-[#F2A93B]'
                      : 'bg-white text-slate-700 border border-[#D8CEB7] hover:bg-slate-50'
                  }`}
                >
                  বিগত {y} সাল
                </button>
              ))}
            </div>

            <span className="text-xs font-bold text-slate-500 font-heading">
              দেখানো হচ্ছে: {filteredItems.length}টি
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="প্রশ্নের নাম, সাল বা লেখার অংশ দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none font-body"
            />
          </div>
        </div>

        {/* Questions Checklist */}
        <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center bg-white/70 rounded-xl border border-dashed border-[#D8CEB7] space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600 font-heading">
                কোনো প্রশ্ন পাওয়া যায়নি
              </p>
              <p className="text-[11px] text-slate-500">
                অন্য সার্চ শব্দ দিয়ে খুঁজুন অথবা নতুন প্রশ্ন যুক্ত করুন।
              </p>
            </div>
          ) : (
            filteredItems.map((q) => {
              const inSuggestion = isIncludedInActiveSuggestion(q);
              const sec = getSuggestionSection(q);
              const secMeta = SECTIONS_META[sec];
              const hasImages = q.imageUrls && q.imageUrls.length > 0;
              const hasPdf = Boolean(q.pdfUrl);
              const isUpdating = updatingId === q.id;
              const importance = q.importance || 'high';

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                    inSuggestion 
                      ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs' 
                      : 'bg-white border-[#D8CEB7] hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Section Tag */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold ${secMeta.badgeBg} ${secMeta.badgeText} px-2.5 py-0.5 rounded-md shadow-2xs`}>
                          {secMeta.name} • {secMeta.typeLabel}
                        </span>

                        {inSuggestion ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-md shadow-2xs">
                            <Check className="w-3 h-3" />
                            চলতি সাজেশনে যুক্ত
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                            প্রশ্নব্যাংকে রয়েছে
                          </span>
                        )}

                        {q.examYear && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-[#1B2A4A] px-2 py-0.5 rounded-md border border-[#F2A93B]/40">
                            <Calendar className="w-3 h-3 text-[#F2A93B]" />
                            বিগত {q.examYear}
                          </span>
                        )}

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

                    {/* Inclusion Toggle Button */}
                    <div className="shrink-0">
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleToggle(q, inSuggestion)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-extrabold font-heading flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                          inSuggestion
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                            : 'bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B]'
                        }`}
                      >
                        {isUpdating ? (
                          '...'
                        ) : inSuggestion ? (
                          <>
                            <Minus className="w-3.5 h-3.5 text-rose-600" />
                            সাজেশন থেকে বাদ দিন
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5 text-[#F2A93B]" />
                            সাজেশনে যুক্ত করুন
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Content snippet */}
                  <p className="text-xs text-slate-600 font-body line-clamp-2 leading-relaxed bg-[#FAF6EC]/80 p-2 rounded-lg border border-[#EAE2CE]">
                    {q.content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')}
                  </p>

                  {/* Importance selector & Section Changer */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#D8CEB7]/60 text-xs flex-wrap">
                    {/* Section Switcher */}
                    <div className="flex items-center gap-1 text-[10px] text-slate-600">
                      <span className="font-bold">বিভাগ:</span>
                      <button
                        type="button"
                        onClick={() => handleSetSection(q, 'A')}
                        className={`px-2 py-0.5 rounded font-bold transition ${sec === 'A' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}
                      >
                        ক
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetSection(q, 'B')}
                        className={`px-2 py-0.5 rounded font-bold transition ${sec === 'B' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-700'}`}
                      >
                        খ
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetSection(q, 'C')}
                        className={`px-2 py-0.5 rounded font-bold transition ${sec === 'C' ? 'bg-purple-700 text-white' : 'bg-slate-100 text-slate-700'}`}
                      >
                        গ
                      </button>
                    </div>

                    {/* Importance */}
                    {inSuggestion && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#F2A93B] fill-[#F2A93B]" />
                          গুরুত্ব:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSetImportance(q, 'high')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            importance === 'high'
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          ⭐⭐⭐ ৯৯%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetImportance(q, 'medium')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            importance === 'medium'
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          ⭐⭐ ৯০%
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetImportance(q, 'normal')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                            importance === 'normal'
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          ⭐ সাধারণ
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#D8CEB7] text-xs">
          <span className="text-[11px] text-slate-500">
            পরিবর্তনসমূহ তাৎক্ষণিকভাবে ডাটাবেজে সংরক্ষিত হয়।
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold rounded-xl text-xs font-heading shadow-xs cursor-pointer"
          >
            সম্পন্ন করুন
          </button>
        </div>

      </div>
    </div>
  );
};
