import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  BookOpen, 
  Check, 
  Trash2, 
  Copy, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  HelpCircle,
  Calendar,
  ListPlus,
  ArrowRight,
  RefreshCw,
  Eye,
  Edit3
} from 'lucide-react';
import { Subject, Suggestion } from '../types';
import { SuggestionSection, SECTIONS_META } from '../utils/sectionHelper';
import { parseBulkQuestionsText, ParsedBulkItem, SAMPLE_SECTION_A_TEXT, convertEnglishToBengali } from '../utils/bulkParser';
import { addBulkSuggestions } from '../services/db';

interface BulkSectionAImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubject: Subject;
  initialSection?: SuggestionSection;
  onSuccess: (count: number) => void;
}

export const BulkSectionAImportModal: React.FC<BulkSectionAImportModalProps> = ({
  isOpen,
  onClose,
  selectedSubject,
  initialSection = 'A',
  onSuccess
}) => {
  const [rawText, setRawText] = useState('');
  const [targetSection, setTargetSection] = useState<SuggestionSection>(initialSection);
  const [targetImportance, setTargetImportance] = useState<'high' | 'medium' | 'normal'>('high');
  const [inSuggestion, setInSuggestion] = useState(true);
  const [parsedItems, setParsedItems] = useState<ParsedBulkItem[]>([]);
  const [activeStep, setActiveStep] = useState<'paste' | 'preview'>('paste');
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ saved: number; total: number } | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Sync initialSection prop when opened
  useEffect(() => {
    if (isOpen) {
      setTargetSection(initialSection);
    }
  }, [isOpen, initialSection]);

  // Live parsing whenever rawText, section, importance, or inSuggestion changes
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedItems([]);
      return;
    }
    const items = parseBulkQuestionsText(rawText, targetSection, targetImportance, inSuggestion);
    setParsedItems(items);
  }, [rawText, targetSection, targetImportance, inSuggestion]);

  if (!isOpen) return null;

  const handleLoadSample = () => {
    setRawText(SAMPLE_SECTION_A_TEXT);
  };

  const handleClear = () => {
    if (rawText && !window.confirm('আপনি কি নিশ্চিত যে পেস্ট করা টেক্সট ক্লিয়ার করতে চান?')) return;
    setRawText('');
    setParsedItems([]);
    setActiveStep('paste');
  };

  const handleRemoveItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<ParsedBulkItem>) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleSaveAll = async () => {
    if (parsedItems.length === 0) {
      alert('সংরক্ষণ করার মতো কোনো প্রশ্ন পাওয়া যায়নি। অনুগ্রহ করে টেক্সট পেস্ট করুন।');
      return;
    }

    setSaving(true);
    setSaveProgress({ saved: 0, total: parsedItems.length });

    try {
      const payload = parsedItems.map((item, idx) => ({
        subjectId: selectedSubject.id,
        title: item.title,
        content: item.content,
        section: item.section,
        importance: item.importance,
        inSuggestion: item.inSuggestion,
        order: item.order || (idx + 1),
        examYear: item.examYear || '',
        contentType: item.inSuggestion ? ('suggestion' as const) : ('question' as const),
        imageUrls: []
      }));

      const count = await addBulkSuggestions(payload, (saved, total) => {
        setSaveProgress({ saved, total });
      });

      onSuccess(count);
      // Reset
      setRawText('');
      setParsedItems([]);
      setActiveStep('paste');
      onClose();
    } catch (err: any) {
      alert('বাল্ক সংরক্ষণ করতে সমস্যা হয়েছে: ' + (err.message || err));
    } finally {
      setSaving(false);
      setSaveProgress(null);
    }
  };

  const secMeta = SECTIONS_META[targetSection];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FAF6EC] border-2 border-[#1B2A4A] rounded-2xl max-w-4xl w-full p-5 sm:p-7 space-y-4 shadow-2xl relative my-6 text-[#1B2A4A] max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={saving}
          className="absolute top-4 right-4 p-2 text-slate-500 hover:text-black rounded-lg transition hover:bg-slate-200 cursor-pointer"
          title="বন্ধ করুন"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8 shrink-0">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-[#1B2A4A] text-[#F2A93B] rounded-full text-xs font-bold font-heading">
            <BookOpen className="w-3.5 h-3.5" />
            {selectedSubject.name}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#1B2A4A] flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-[#F2A93B]" />
              ক বিভাগ: ৪০-১০০টি প্রশ্ন একসাথে পেস্ট ও ইমপোর্ট
            </h3>
          </div>
          <p className="text-xs text-slate-600 font-body">
            আপনার কাছে থাকা প্রশ্ন-উত্তরের সম্পূর্ণ শিট এখানে পেস্ট করুন। সিস্টেম স্বয়ংক্রিয়ভাবে প্রতিটির প্রশ্ন, উত্তর ও পরীক্ষার সাল আলাদা করে যুক্ত করে দিবে।
          </p>
        </div>

        {/* Top Step & Summary Switcher */}
        <div className="flex items-center justify-between gap-2 border-b border-[#D8CEB7] pb-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveStep('paste')}
              className={`px-3.5 py-1.5 rounded-xl font-heading font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                activeStep === 'paste'
                  ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-xs'
                  : 'bg-white text-slate-700 border border-[#D8CEB7] hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              ১. প্রশ্ন টেক্সট পেস্ট করুন
            </button>

            <button
              type="button"
              disabled={parsedItems.length === 0}
              onClick={() => setActiveStep('preview')}
              className={`px-3.5 py-1.5 rounded-xl font-heading font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                activeStep === 'preview'
                  ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-xs'
                  : 'bg-white text-slate-700 border border-[#D8CEB7] hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <Eye className="w-4 h-4" />
              ২. প্রিভিউ ও যাচাই ({convertEnglishToBengali(parsedItems.length)}টি)
            </button>
          </div>

          {parsedItems.length > 0 && (
            <div className="flex items-center gap-2 text-xs font-bold font-heading bg-emerald-100 text-emerald-900 px-3 py-1 rounded-xl border border-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>{convertEnglishToBengali(parsedItems.length)}টি প্রশ্ন প্রস্তুত</span>
            </div>
          )}
        </div>

        {/* MAIN BODY AREA */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[300px]">
          {activeStep === 'paste' ? (
            <div className="space-y-4">
              
              {/* Controls Bar */}
              <div className="p-3 bg-white border border-[#D8CEB7] rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-2xs">
                {/* Target Section */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 font-heading block">
                    বিভাগ নির্ধারণ:
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setTargetSection('A')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition font-heading ${
                        targetSection === 'A'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      ক বিভাগ
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetSection('B')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition font-heading ${
                        targetSection === 'B'
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      খ বিভাগ
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetSection('C')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition font-heading ${
                        targetSection === 'C'
                          ? 'bg-purple-700 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      গ বিভাগ
                    </button>
                  </div>
                </div>

                {/* Default Importance */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 font-heading block">
                    কমন গুরুত্ব স্তর:
                  </label>
                  <select
                    value={targetImportance}
                    onChange={(e) => setTargetImportance(e.target.value as any)}
                    className="w-full py-1.5 px-2.5 bg-white border border-[#D8CEB7] rounded-lg text-xs font-bold text-[#1B2A4A] outline-none"
                  >
                    <option value="high">⭐⭐⭐ ৯৯% কমন (সর্বোচ্চ গুরুত্ব)</option>
                    <option value="medium">⭐⭐ ৯০% কমন (মাঝারি গুরুত্ব)</option>
                    <option value="normal">⭐ সাধারণ (প্রস্তুতির জন্য)</option>
                  </select>
                </div>

                {/* Destination Toggle */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 font-heading block">
                    কোথায় যুক্ত হবে:
                  </label>
                  <button
                    type="button"
                    onClick={() => setInSuggestion(!inSuggestion)}
                    className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 font-heading ${
                      inSuggestion
                        ? 'bg-[#1B2A4A] text-[#F2A93B]'
                        : 'bg-amber-100 text-slate-800 border border-[#F2A93B]/40'
                    }`}
                  >
                    {inSuggestion ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-[#F2A93B]" />
                        চলতি চূড়ান্ত সাজেশনে
                      </>
                    ) : (
                      <>
                        <Layers className="w-3.5 h-3.5" />
                        শুধু প্রশ্নব্যাংকে
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Paste Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <label className="font-bold text-[#1B2A4A] font-heading flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#F2A93B]" />
                    এখানে সম্পূর্ণ প্রশ্নাবলি ও উত্তর পেস্ট করুন:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLoadSample}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#1B2A4A] border border-[#F2A93B]/50 rounded-lg text-[11px] font-bold font-heading transition cursor-pointer"
                    >
                      নমুনা লোড করুন
                    </button>
                    {rawText && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[11px] font-bold font-heading transition cursor-pointer"
                      >
                        ক্লিয়ার
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  rows={12}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`উদাহরণ ফরম্যাট:\n\n১. 'বঙ্গাল' শব্দের প্রথম উল্লেখ পাওয়া যায় কোন গ্রন্থে?\nউত্তর: 'ঐতরেয় আরণ্যক' গ্রন্থে। [বিগত ২০১৮]\n\n২. 'অখণ্ড স্বাধীন বাংলা' গঠনের প্রস্তাবক কে ছিলেন?\nউত্তর: হোসেন শহীদ সোহ্‌রাওয়ার্দী ও আবুল হাশিম। [বিগত ২০১৯]\n\n(৩) শেখ মুজিবুর রহমানকে 'বঙ্গবন্ধু' উপাধিতে ভূষিত করা হয় কবে?\nউত্তর: ১৯৬৯ সালের ২৩ ফেব্রুয়ারি।\n\n...এভাবে ৪০-১০০টি প্রশ্ন একসাথে কপি করে পেস্ট করে দিন!`}
                  className="w-full p-4 bg-white border-2 border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs sm:text-sm text-[#1B2A4A] outline-none font-body font-mono leading-relaxed shadow-inner"
                />
              </div>

              {/* Format Assistant hints */}
              <div className="p-3 bg-amber-50/70 border border-[#F2A93B]/30 rounded-xl space-y-1 text-xs text-slate-700">
                <p className="font-bold text-[#1B2A4A] flex items-center gap-1.5 font-heading">
                  <HelpCircle className="w-3.5 h-3.5 text-[#F2A93B]" />
                  স্মার্ট পার্সিং নির্দেশিকা:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 font-body">
                  <li>সংখ্যায়ন বাংলা (১, ২, ৩...) বা ইংরেজি (1, 2, 3...) যে কোনো ফরম্যাটে হতে পারে।</li>
                  <li>প্রশ্নের নিচে <code className="bg-white px-1 py-0.5 rounded border border-amber-200 text-slate-800">উত্তর:</code> বা <code className="bg-white px-1 py-0.5 rounded border border-amber-200 text-slate-800">Ans:</code> লিখলে উত্তর আলাদা হয়ে যাবে।</li>
                  <li>ব্র্যাকেটের ভেতরে সাল (যেমন: <code className="bg-white px-1 py-0.5 rounded border border-amber-200 text-slate-800">[২০১৯]</code> বা <code className="bg-white px-1 py-0.5 rounded border border-amber-200 text-slate-800">(বিগত ২০২০)</code>) থাকলে সাল স্বয়ংক্রিয়ভাবে ফিল্টার ট্যাগে যুক্ত হবে।</li>
                </ul>
              </div>

            </div>
          ) : (
            /* PREVIEW STEP */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 p-3 bg-white border border-[#D8CEB7] rounded-xl text-xs flex-wrap">
                <span className="font-bold text-[#1B2A4A] font-heading">
                  সনাক্তকৃত প্রশ্ন তালিকা ({convertEnglishToBengali(parsedItems.length)}টি):
                </span>
                <span className="text-[11px] text-slate-500">
                  নিচে প্রতিটি প্রশ্ন চেক করুন। প্রয়োজনে যেকোনো প্রশ্ন এডিট বা রিমুভ করতে পারবেন।
                </span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {parsedItems.map((item, idx) => {
                  const isEditing = editingItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white border border-[#D8CEB7] rounded-xl space-y-2 shadow-2xs hover:border-slate-400 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-full bg-[#1B2A4A] text-[#F2A93B] font-bold text-xs flex items-center justify-center font-heading shrink-0">
                            {convertEnglishToBengali(idx + 1)}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${secMeta.badgeBg} ${secMeta.badgeText}`}>
                            {secMeta.name}
                          </span>
                          {item.examYear && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-[#1B2A4A] border border-[#F2A93B]/40 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#F2A93B]" />
                              {item.examYear}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white">
                            {item.importance === 'high' ? '৯৯% কমন' : item.importance === 'medium' ? '৯০% কমন' : 'সাধারণ'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setEditingItemId(isEditing ? null : item.id)}
                            className="p-1 text-slate-500 hover:text-[#1B2A4A] rounded hover:bg-slate-100"
                            title="সম্পাদনা করুন"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">প্রশ্ন / শিরোনাম:</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs text-[#1B2A4A]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500">উত্তর ও বিবরণ:</label>
                            <textarea
                              rows={3}
                              value={item.content}
                              onChange={(e) => handleUpdateItem(item.id, { content: e.target.value })}
                              className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs text-[#1B2A4A]"
                            />
                          </div>
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              className="px-3 py-1 bg-[#1B2A4A] text-white rounded text-[11px] font-bold"
                            >
                              সম্পন্ন
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h4 className="font-heading font-bold text-xs sm:text-sm text-[#1B2A4A]">
                            {item.title}
                          </h4>
                          {item.content && item.content !== item.title && (
                            <div className="p-2 bg-[#FAF6EC] rounded-lg border border-[#EAE2CE] text-xs text-slate-700 font-body leading-relaxed whitespace-pre-line">
                              {item.content}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* PROGRESS BAR IF SAVING */}
        {saving && saveProgress && (
          <div className="p-3 bg-white border border-[#F2A93B] rounded-xl space-y-2 shadow-sm shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-[#1B2A4A] font-heading">
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#F2A93B] animate-spin" />
                ডাটাবেজে সেভ হচ্ছে...
              </span>
              <span>
                {convertEnglishToBengali(saveProgress.saved)} / {convertEnglishToBengali(saveProgress.total)}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-[#1B2A4A] h-full transition-all duration-200"
                style={{ width: `${(saveProgress.saved / Math.max(saveProgress.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* FOOTER ACTIONS */}
        <div className="flex items-center justify-between pt-3 border-t border-[#D8CEB7] gap-3 shrink-0 flex-wrap">
          <div className="text-xs text-slate-600 font-body">
            {parsedItems.length > 0 ? (
              <span>
                মোট <b>{convertEnglishToBengali(parsedItems.length)}টি</b> প্রশ্ন সেভের জন্য প্রস্তুত।
              </span>
            ) : (
              <span>টেক্সট পেস্ট করে পরবর্তী ধাপে যান।</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeStep === 'paste' ? (
              <button
                type="button"
                disabled={parsedItems.length === 0}
                onClick={() => setActiveStep('preview')}
                className="px-5 py-2.5 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-extrabold rounded-xl text-xs font-heading shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>প্রিভিউ দেখুন ({convertEnglishToBengali(parsedItems.length)}টি প্রশ্ন)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setActiveStep('paste')}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-[#D8CEB7] font-bold rounded-xl text-xs font-heading transition cursor-pointer"
                >
                  পেস্টে ফিরে যান
                </button>

                <button
                  type="button"
                  disabled={saving || parsedItems.length === 0}
                  onClick={handleSaveAll}
                  className="px-6 py-2.5 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] font-extrabold rounded-xl text-xs font-heading shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>সেভ করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <ListPlus className="w-4 h-4" />
                      <span>সবগুলো ({convertEnglishToBengali(parsedItems.length)}টি) প্রশ্ন একসাথে সেভ করুন</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
