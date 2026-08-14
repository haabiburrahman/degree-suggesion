import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  FileCheck, 
  ChevronRight, 
  Search, 
  PlusCircle, 
  X, 
  Upload, 
  Save, 
  CheckCircle2, 
  FileDown, 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  Copy, 
  Star, 
  Plus, 
  Minus, 
  Calendar, 
  Layers, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Eye,
  EyeOff,
  Share2,
  ListPlus
} from 'lucide-react';
import { Subject, Suggestion } from '../types';
import { useAuth } from '../context/AuthContext';
import { addSuggestion, updateSuggestion } from '../services/db';
import { FormattedContent } from '../components/FormattedContent';
import { LinkInsertToolbar } from '../components/LinkInsertToolbar';
import { QuestionPickerModal } from '../components/QuestionPickerModal';
import { QuestionBankManagerModal, isIncludedInActiveSuggestion } from '../components/QuestionBankManagerModal';
import { BulkSectionAImportModal } from '../components/BulkSectionAImportModal';
import { SuggestionSection, SECTIONS_META, getSuggestionSection } from '../utils/sectionHelper';
import { sortSuggestionsBySerial, formatBnSerial, extractLeadingNumber } from '../utils/orderHelper';

interface SuggestionListPageProps {
  selectedSubject: Subject;
  suggestions: Suggestion[];
  allSuggestions?: Suggestion[];
  allSubjects?: Subject[];
  onSelectSuggestion: (suggestion: Suggestion) => void;
}

export const SuggestionListPage: React.FC<SuggestionListPageProps> = ({
  selectedSubject,
  suggestions,
  allSuggestions = [],
  allSubjects = [],
  onSelectSuggestion,
}) => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'suggestion' | 'question_bank'>('suggestion');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<'ALL' | SuggestionSection>('ALL');
  const [importanceFilter, setImportanceFilter] = useState<'all' | 'high' | 'medium' | 'normal'>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Accordion state for Part B & C toggles
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkInitialSection, setBulkInitialSection] = useState<SuggestionSection>('A');
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
  const [isBankManagerOpen, setIsBankManagerOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const newContentRef = useRef<HTMLTextAreaElement>(null);
  const [newSection, setNewSection] = useState<SuggestionSection>('A');
  const [newExamYear, setNewExamYear] = useState('');
  const [newInSuggestion, setNewInSuggestion] = useState(true);
  const [newImportance, setNewImportance] = useState<'high' | 'medium' | 'normal'>('high');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const toggleAccordion = (id: string) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleExpandAllInSection = (items: Suggestion[], expand: boolean) => {
    setExpandedIds(prev => {
      const next = { ...prev };
      items.forEach(item => {
        next[item.id] = expand;
      });
      return next;
    });
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('উত্তরটি ক্লিপবোর্ডে কপি করা হয়েছে!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Distinct exam years in question bank
  const distinctExamYears = Array.from(
    new Set(
      suggestions
        .map(s => s.examYear?.trim())
        .filter((y): y is string => Boolean(y))
    )
  ).sort().reverse();

  // Active suggestions vs total question bank
  const activeSuggestions = suggestions.filter(isIncludedInActiveSuggestion);
  const totalQuestionCount = suggestions.length;
  const activeSuggestionCount = activeSuggestions.length;

  // Filtered based on activeTab, search, importance, year & section
  const filteredList = suggestions.filter((s) => {
    const inSuggestion = isIncludedInActiveSuggestion(s);
    const itemSection = getSuggestionSection(s);

    // Tab filtering
    if (activeTab === 'suggestion' && !inSuggestion) {
      return false;
    }

    // Section filtering
    if (selectedSectionFilter !== 'ALL' && itemSection !== selectedSectionFilter) {
      return false;
    }

    // Importance filtering in suggestion tab
    if (activeTab === 'suggestion' && importanceFilter !== 'all') {
      const imp = s.importance || 'high';
      if (imp !== importanceFilter) return false;
    }

    // Year filtering in question bank tab
    if (activeTab === 'question_bank' && yearFilter !== 'all') {
      if (s.examYear !== yearFilter) return false;
    }

    // Search filtering
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchesTitle = s.title.toLowerCase().includes(term);
      const matchesContent = s.content.toLowerCase().includes(term);
      const matchesYear = s.examYear && s.examYear.toLowerCase().includes(term);
      return matchesTitle || matchesContent || matchesYear;
    }

    return true;
  });

  // Group by Section A, B, C and sort by strict serial order
  const sectionAGroup = sortSuggestionsBySerial(filteredList.filter(s => getSuggestionSection(s) === 'A'));
  const sectionBGroup = sortSuggestionsBySerial(filteredList.filter(s => getSuggestionSection(s) === 'B'));
  const sectionCGroup = sortSuggestionsBySerial(filteredList.filter(s => getSuggestionSection(s) === 'C'));

  // Count items per section in current tab
  const getSectionCount = (sec: SuggestionSection) => {
    return suggestions.filter(s => {
      const inSugg = isIncludedInActiveSuggestion(s);
      if (activeTab === 'suggestion' && !inSugg) return false;
      return getSuggestionSection(s) === sec;
    }).length;
  };

  // Toggle item in/out of suggestion
  const handleToggleSuggestion = async (
    e: React.MouseEvent,
    item: Suggestion, 
    currentlyIn: boolean, 
    defaultImportance: 'high' | 'medium' | 'normal' = 'high'
  ) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setUpdatingId(item.id);
    try {
      const nextIn = !currentlyIn;
      await updateSuggestion(item.id, {
        inSuggestion: nextIn,
        importance: nextIn ? (item.importance || defaultImportance) : item.importance,
        contentType: nextIn ? 'suggestion' : 'question'
      });

      showToast(
        nextIn 
          ? `"${item.title.substring(0, 25)}..." চলতি সাজেশনে যুক্ত হয়েছে!`
          : `"${item.title.substring(0, 25)}..." সাজেশন থেকে বাদ দেওয়া হয়েছে!`
      );
    } catch (err: any) {
      alert('স্ট্যাটাস পরিবর্তনে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Change importance level
  const handleChangeImportance = async (
    e: React.MouseEvent,
    item: Suggestion, 
    importance: 'high' | 'medium' | 'normal'
  ) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setUpdatingId(item.id);
    try {
      await updateSuggestion(item.id, {
        inSuggestion: true,
        importance
      });
      showToast('গুরুত্ব স্তর আপডেট হয়েছে!');
    } catch (err: any) {
      alert('আপডেট ব্যর্থ: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick Section Change by Admin
  const handleChangeSection = async (
    e: React.MouseEvent,
    item: Suggestion,
    newSec: SuggestionSection
  ) => {
    e.stopPropagation();
    if (!isAdmin) return;
    setUpdatingId(item.id);
    try {
      await updateSuggestion(item.id, {
        section: newSec
      });
      showToast(`বিভাগ "${SECTIONS_META[newSec].name}"-এ স্থানান্তরিত হয়েছে!`);
    } catch (err: any) {
      alert('বিভাগ আপডেট ব্যর্থ: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleFileUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setImageUrls(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileUploadPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) {
        setPdfUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectQuestionFromPicker = (
    q: Suggestion, 
    mode: 'load_all' | 'append_text' | 'quick_duplicate'
  ) => {
    setIsQuestionPickerOpen(false);

    if (mode === 'load_all') {
      setNewTitle(q.title);
      setNewContent(q.content);
      setNewSection(getSuggestionSection(q));
      setNewExamYear(q.examYear || '');
      setNewInSuggestion(true);
      setNewImportance(q.importance || 'high');
      setImageUrls(q.imageUrls || []);
      setPdfUrl(q.pdfUrl || '');
      setIsModalOpen(true);
      showToast('প্রশ্নের তথ্য ফর্মে লোড হয়েছে!');
    } else if (mode === 'append_text') {
      if (!newTitle.trim()) {
        setNewTitle(q.title);
      }
      const addition = `### ${q.title}\n${q.content}`;
      setNewContent(prev => prev.trim() ? `${prev.trim()}\n\n${addition}` : addition);
      if (q.imageUrls && q.imageUrls.length > 0) {
        setImageUrls(prev => Array.from(new Set([...prev, ...q.imageUrls])));
      }
      if (q.pdfUrl && !pdfUrl) {
        setPdfUrl(q.pdfUrl);
      }
      setIsModalOpen(true);
      showToast('প্রশ্নটি উত্তরের সাথে যুক্ত হয়েছে!');
    } else if (mode === 'quick_duplicate') {
      handleDuplicateDirect(q);
    }
  };

  const handleDuplicateDirect = async (q: Suggestion) => {
    if (!isAdmin) {
      alert('সাজেশনে প্রশ্ন যুক্ত করতে অনুগ্রহ করে এডমিন একাউন্টে লগইন করুন।');
      return;
    }
    setSaving(true);
    try {
      await addSuggestion({
        subjectId: selectedSubject.id,
        title: q.title,
        content: q.content,
        section: getSuggestionSection(q),
        imageUrls: q.imageUrls || [],
        pdfUrl: q.pdfUrl || '',
        inSuggestion: true,
        importance: q.importance || 'high',
        examYear: q.examYear || '',
        contentType: 'suggestion'
      });
      setActiveTab('suggestion');
      showToast('প্রশ্নটি সাজেশনে সফলভাবে যুক্ত হয়েছে!');
    } catch (err: any) {
      alert('সাজেশনে যুক্ত করতে সমস্যা: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('প্রশ্ন সেভ করতে অনুগ্রহ করে এডমিন একাউন্টে লগইন করুন।');
      return;
    }
    if (!newTitle.trim()) {
      alert('অনুগ্রহ করে প্রশ্নের শিরোনাম লিখুন।');
      return;
    }
    if (!newContent.trim()) {
      alert('অনুগ্রহ করে প্রশ্নের উত্তর বা বিষয়বস্তু লিখুন।');
      return;
    }

    setSaving(true);
    try {
      const extractedOrder = extractLeadingNumber(newTitle.trim());
      const sectionCount = suggestions.filter(s => getSuggestionSection(s) === newSection).length;
      const calculatedOrder = extractedOrder !== null ? extractedOrder : (sectionCount + 1);

      await addSuggestion({
        subjectId: selectedSubject.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        section: newSection,
        imageUrls,
        pdfUrl: pdfUrl.trim() || '',
        inSuggestion: newInSuggestion,
        importance: newImportance,
        order: calculatedOrder,
        examYear: newExamYear.trim() || '',
        contentType: newInSuggestion ? 'suggestion' : 'question'
      });

      showToast(newInSuggestion ? 'নতুন প্রশ্নটি চূড়ান্ত সাজেশনে যুক্ত করা হয়েছে!' : 'নতুন প্রশ্নটি প্রশ্নব্যাংকে সংরক্ষিত হয়েছে!');
      
      if (newInSuggestion) {
        setActiveTab('suggestion');
      } else {
        setActiveTab('question_bank');
      }

      // Reset
      setNewTitle('');
      setNewContent('');
      setNewExamYear('');
      setNewInSuggestion(true);
      setNewImportance('high');
      setImageUrls([]);
      setImageUrlInput('');
      setPdfUrl('');
      setIsModalOpen(false);
    } catch (err: any) {
      alert('সংরক্ষণ ব্যর্থ: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-xl shadow-xl border bg-[#1B2A4A] text-[#F2A93B] border-[#F2A93B] text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#F2A93B]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Subject Banner */}
      <div className="notebook-sheet p-6 sm:p-8 rounded-2xl border-2 border-[#E2D9C5] space-y-5 shadow-sm">
        
        {/* Top bar with Subject & Admin Actions */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#1B2A4A] text-[#F2A93B] rounded-full text-xs font-bold font-heading">
            <BookOpen className="w-4 h-4" />
            {selectedSubject.name}
          </div>

          {/* Admin Management Buttons */}
          {isAdmin && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setBulkInitialSection('A');
                  setIsBulkModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl text-xs font-heading shadow-md transition transform active:scale-95 cursor-pointer"
                title="ক বিভাগের ৪০-১০০টি প্রশ্ন একসাথে কপি-পেস্ট করুন"
              >
                <ListPlus className="w-4 h-4 text-emerald-300" />
                <span>ক বিভাগের বাল্ক পেস্ট (৪০-১০০টি)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBankManagerOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#FAF6EC] hover:bg-[#EAE2CE] text-[#1B2A4A] border-2 border-[#D8CEB7] font-bold rounded-xl text-xs font-heading shadow-xs transition cursor-pointer"
                title="প্রশ্নব্যাংক থেকে সাজেশনে প্রশ্ন যুক্ত বা বাদ দিন"
              >
                <Layers className="w-4 h-4 text-[#F2A93B]" />
                <span>প্রশ্ন নির্বাচন ও পরিচালনা</span>
                <span className="bg-[#1B2A4A] text-[#F2A93B] px-2 py-0.5 rounded-md text-[10px]">
                  {activeSuggestionCount}/{totalQuestionCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewInSuggestion(true);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] font-extrabold rounded-xl text-xs font-heading shadow-md transition transform active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                নতুন প্রশ্ন / সাজেশন যুক্ত করুন
              </button>
            </div>
          )}
        </div>

        {/* Title and Subtitle */}
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B2A4A] tracking-tight">
            {selectedSubject.name} — চূড়ান্ত সাজেশন ও প্রশ্নব্যাংক
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-body mt-1">
            ডিগ্রি পরীক্ষার সম্পূর্ণ সিলেবাস অনুযায়ী ৩টি অংশে বিভক্ত: <b>ক বিভাগ (অতি সংক্ষিপ্ত)</b>, <b>খ বিভাগ (সংক্ষিপ্ত)</b> এবং <b>গ বিভাগ (রচনামূলক)</b>।
          </p>
        </div>

        {/* Main Tab Switch: চলতি সাজেশন vs সম্পূর্ণ প্রশ্নব্যাংক */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#E2D9C5]/80 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveTab('suggestion');
              setImportanceFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'suggestion'
                ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-md border-2 border-[#1B2A4A]'
                : 'bg-[#FAF6EC] text-slate-700 hover:bg-[#EAE2CE] border border-[#D8CEB7]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#F2A93B]" />
            <span>চলতি চূড়ান্ত সাজেশন</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'suggestion' ? 'bg-[#F2A93B] text-[#1B2A4A]' : 'bg-[#D8CEB7] text-slate-700'
            }`}>
              {activeSuggestionCount}টি
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('question_bank');
              setYearFilter('all');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'question_bank'
                ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-md border-2 border-[#1B2A4A]'
                : 'bg-[#FAF6EC] text-slate-700 hover:bg-[#EAE2CE] border border-[#D8CEB7]'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-[#F2A93B]" />
            <span>সম্পূর্ণ প্রশ্নব্যাংক (বিগত সালসমূহ)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'question_bank' ? 'bg-[#F2A93B] text-[#1B2A4A]' : 'bg-[#D8CEB7] text-slate-700'
            }`}>
              {totalQuestionCount}টি
            </span>
          </button>
        </div>

        {/* 3 Sections Quick Filter Tabs */}
        <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#D8CEB7] space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-extrabold text-[#1B2A4A] font-heading flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#F2A93B]" />
              বিভাগ নির্বাচন করুন:
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedSectionFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-heading cursor-pointer ${
                  selectedSectionFilter === 'ALL'
                    ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#D8CEB7]'
                }`}
              >
                সকল বিভাগ এক সাথে ({filteredList.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedSectionFilter('A')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-heading cursor-pointer flex items-center gap-1.5 ${
                  selectedSectionFilter === 'A'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#D8CEB7]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ক বিভাগ (অতি সংক্ষিপ্ত: {getSectionCount('A')}টি)
              </button>

              <button
                type="button"
                onClick={() => setSelectedSectionFilter('B')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-heading cursor-pointer flex items-center gap-1.5 ${
                  selectedSectionFilter === 'B'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#D8CEB7]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                খ বিভাগ (সংক্ষিপ্ত: {getSectionCount('B')}টি)
              </button>

              <button
                type="button"
                onClick={() => setSelectedSectionFilter('C')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition font-heading cursor-pointer flex items-center gap-1.5 ${
                  selectedSectionFilter === 'C'
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-[#D8CEB7]'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                গ বিভাগ (রচনামূলক: {getSectionCount('C')}টি)
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Filters: Importance (in Suggestion tab) or Year (in Question Bank tab) & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {activeTab === 'suggestion' ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 font-heading mr-1">গুরুত্ব স্তর:</span>
              <button
                type="button"
                onClick={() => setImportanceFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  importanceFilter === 'all'
                    ? 'bg-[#1B2A4A] text-[#F2A93B]'
                    : 'bg-[#FAF6EC] text-slate-700 border border-[#D8CEB7]'
                }`}
              >
                সকল
              </button>
              <button
                type="button"
                onClick={() => setImportanceFilter('high')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  importanceFilter === 'high'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-[#FAF6EC] text-slate-700 border border-[#D8CEB7]'
                }`}
              >
                ⭐⭐⭐ ৯৯% কমন
              </button>
              <button
                type="button"
                onClick={() => setImportanceFilter('medium')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  importanceFilter === 'medium'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-[#FAF6EC] text-slate-700 border border-[#D8CEB7]'
                }`}
              >
                ⭐⭐ ৯০% কমন
              </button>
              <button
                type="button"
                onClick={() => setImportanceFilter('normal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  importanceFilter === 'normal'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-[#FAF6EC] text-slate-700 border border-[#D8CEB7]'
                }`}
              >
                ⭐ সাধারণ
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-slate-500 font-heading mr-1">পরীক্ষার সাল:</span>
              <button
                type="button"
                onClick={() => setYearFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  yearFilter === 'all'
                    ? 'bg-[#1B2A4A] text-[#F2A93B]'
                    : 'bg-[#FAF6EC] text-slate-700 border border-[#D8CEB7]'
                }`}
              >
                সকল সাল
              </button>
              {distinctExamYears.map(y => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYearFilter(y)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    yearFilter === y
                      ? 'bg-[#1B2A4A] text-[#F2A93B]'
                      : 'bg-[#FAF6EC] text-slate-700 border border-[#D8CEB7]'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`${activeTab === 'suggestion' ? 'সাজেশনের' : 'প্রশ্নব্যাংকের'} প্রশ্ন খুঁজুন...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs font-body text-[#1B2A4A] outline-none"
            />
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      {filteredList.length === 0 ? (
        <div className="notebook-sheet p-8 sm:p-12 text-center rounded-2xl border border-[#E2D9C5] text-slate-600 space-y-4">
          <FileText className="w-12 h-12 text-[#F2A93B] mx-auto opacity-80" />
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-lg text-[#1B2A4A]">
              {activeTab === 'suggestion' ? 'কোনো চূড়ান্ত সাজেশন পাওয়া যায়নি' : 'প্রশ্নব্যাংকে কোনো প্রশ্ন পাওয়া যায়নি'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-body">
              {activeTab === 'suggestion'
                ? 'প্রশ্নব্যাংক থেকে গুরুত্বপূর্ণ প্রশ্নসমূহ নির্বাচন করে এই বছরের চূড়ান্ত সাজেশনে যুক্ত করুন।'
                : 'এই বিষয়ে এখনো কোনো প্রশ্নপত্র সংরক্ষণ করা হয়নি।'}
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
              {activeTab === 'suggestion' && totalQuestionCount > 0 && (
                <button
                  type="button"
                  onClick={() => setIsBankManagerOpen(true)}
                  className="px-5 py-2.5 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold rounded-xl text-xs font-heading shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  প্রশ্নব্যাংক থেকে সাজেশন নির্বাচন করুন
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setNewInSuggestion(activeTab === 'suggestion');
                  setIsModalOpen(true);
                }}
                className="px-5 py-2.5 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] font-extrabold rounded-xl text-xs font-heading shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                নতুন প্রশ্ন যুক্ত করুন
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* ========================================================================= */}
          {/* SECTION A: ক বিভাগ (অতি সংক্ষিপ্ত প্রশ্ন ও উত্তর) - প্রশ্ন ও উত্তর সরাসরি পেইজে */}
          {/* ========================================================================= */}
          {(selectedSectionFilter === 'ALL' || selectedSectionFilter === 'A') && (
            <div className="space-y-4">
              
              {/* Section Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-[#1B2A4A] text-white rounded-2xl shadow-md border-l-6 border-emerald-400 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-400 text-emerald-950 font-heading">
                      ক বিভাগ
                    </span>
                    <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white">
                      অতি সংক্ষিপ্ত প্রশ্ন ও উত্তর (Part A)
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-100/90 font-body">
                    {SECTIONS_META.A.description} • <span className="font-bold text-amber-300">{SECTIONS_META.A.marksInfo}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setBulkInitialSection('A');
                        setIsBulkModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-extrabold rounded-xl text-xs font-heading shadow-xs transition cursor-pointer"
                      title="ক বিভাগের অনেকগুলো প্রশ্ন একসাথে পেস্ট করুন"
                    >
                      <ListPlus className="w-3.5 h-3.5" />
                      একসাথে ৪০-১০০টি পেস্ট করুন
                    </button>
                  )}
                  <span className="px-3 py-1 bg-white/15 text-white font-bold rounded-xl text-xs font-heading">
                    মোট: {sectionAGroup.length}টি প্রশ্ন
                  </span>
                </div>
              </div>

              {/* Items under Section A */}
              {sectionAGroup.length === 0 ? (
                <div className="notebook-sheet p-8 text-center rounded-2xl border-2 border-dashed border-[#D8CEB7] text-xs text-slate-600 space-y-3">
                  <p className="font-heading font-bold text-sm text-[#1B2A4A]">ক বিভাগে কোনো প্রশ্ন যুক্ত করা হয়নি।</p>
                  {isAdmin && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setBulkInitialSection('A');
                          setIsBulkModalOpen(true);
                        }}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <ListPlus className="w-4 h-4" />
                        ক বিভাগের ৪০-১০০টি প্রশ্ন বাল্ক পেস্ট করুন
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {sectionAGroup.map((sugg, index) => {
                    const inSuggestion = isIncludedInActiveSuggestion(sugg);
                    const importance = sugg.importance || 'high';
                    const isUpdating = updatingId === sugg.id;
                    const hasImages = sugg.imageUrls && sugg.imageUrls.length > 0;
                    const hasPdf = Boolean(sugg.pdfUrl);

                    return (
                      <div
                        key={sugg.id}
                        className="notebook-sheet relative p-5 sm:p-6 rounded-2xl border-2 border-[#E2D9C5] hover:border-emerald-500 shadow-xs transition space-y-3"
                      >
                        {/* Red margin line */}
                        <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-red-400/40" />

                        <div className="pl-6 sm:pl-8 space-y-3">
                          
                          {/* Badges & Action Toolbar */}
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-md font-heading font-extrabold text-[10px] bg-emerald-700 text-white shadow-2xs">
                                প্রশ্ন #{formatBnSerial(index + 1)}
                              </span>

                              {inSuggestion ? (
                                <span className="px-2 py-0.5 rounded-md font-heading font-bold text-[10px] bg-[#1B2A4A] text-[#F2A93B] flex items-center gap-1 shadow-2xs">
                                  <Sparkles className="w-3 h-3 text-[#F2A93B]" />
                                  {importance === 'high' ? '⭐⭐⭐ ৯৯% কমন' : importance === 'medium' ? '⭐⭐ ৯০% কমন' : '⭐ সাধারণ'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md font-heading font-bold text-[10px] bg-slate-200 text-slate-700">
                                  প্রশ্নব্যাংক
                                </span>
                              )}

                              {sugg.examYear && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-[#1B2A4A] px-2 py-0.5 rounded-md border border-[#F2A93B]/40">
                                  <Calendar className="w-3 h-3 text-[#F2A93B]" />
                                  বিগত {sugg.examYear}
                                </span>
                              )}

                              {hasImages && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                  <ImageIcon className="w-3 h-3" />
                                  {sugg.imageUrls.length}টি ছবি
                                </span>
                              )}

                              {hasPdf && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md">
                                  <FileCheck className="w-3 h-3" />
                                  PDF
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyText(sugg.id, `প্রশ্ন: ${sugg.title}\nউত্তর: ${sugg.content}`)}
                                className="p-1.5 bg-[#FAF6EC] hover:bg-[#EAE2CE] text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-[#D8CEB7]"
                                title="প্রশ্ন ও উত্তর কপি করুন"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[10px] hidden sm:inline">{copiedId === sugg.id ? 'কপি হয়েছে' : 'কপি'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onSelectSuggestion(sugg)}
                                className="px-3 py-1.5 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="সম্পূর্ণ বিস্তারিত পাতায় দেখুন"
                              >
                                <span className="text-[10px] sm:text-xs">বিস্তারিত পেজ</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Question (প্রশ্ন) */}
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-emerald-800 font-heading">প্রশ্ন:</span>
                            <h4 className="font-heading text-base sm:text-lg font-extrabold text-[#1B2A4A] leading-snug">
                              {sugg.title}
                            </h4>
                          </div>

                          {/* DIRECT ANSWER (উত্তর সরাসরি পেইজে দৃশ্যমান) */}
                          <div className="p-3.5 sm:p-4 bg-[#FFFDF7] rounded-xl border border-emerald-200/80 shadow-2xs space-y-1.5">
                            <span className="text-[11px] font-bold text-emerald-900 font-heading flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              উত্তর:
                            </span>
                            <div className="text-xs sm:text-sm text-[#1B2A4A] font-body leading-relaxed">
                              <FormattedContent content={sugg.content} />
                            </div>
                          </div>

                        </div>

                        {/* Admin Inline Management Toolbar */}
                        {isAdmin && (
                          <div className="pl-6 sm:pl-8 pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-[#EADFC8]/60 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={(e) => handleToggleSuggestion(e, sugg, inSuggestion)}
                                className={`px-2.5 py-1 rounded-lg font-heading font-bold text-[11px] flex items-center gap-1 transition ${
                                  inSuggestion
                                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                                    : 'bg-[#1B2A4A] text-[#F2A93B]'
                                }`}
                              >
                                {isUpdating ? '...' : inSuggestion ? 'সাজেশন থেকে বাদ দিন' : 'সাজেশনে যুক্ত করুন'}
                              </button>

                              {inSuggestion && (
                                <div className="flex items-center gap-1 bg-[#FAF6EC] p-0.5 rounded border border-[#D8CEB7]">
                                  <button
                                    type="button"
                                    onClick={(e) => handleChangeImportance(e, sugg, 'high')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${importance === 'high' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
                                  >
                                    ৯৯%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleChangeImportance(e, sugg, 'medium')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${importance === 'medium' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
                                  >
                                    ৯০%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleChangeImportance(e, sugg, 'normal')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${importance === 'normal' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
                                  >
                                    সাধারণ
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Move Section */}
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <span>বিভাগ পরিবর্তন:</span>
                              <button
                                type="button"
                                onClick={(e) => handleChangeSection(e, sugg, 'B')}
                                className="px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold"
                                title="খ বিভাগে পাঠান"
                              >
                                খ
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleChangeSection(e, sugg, 'C')}
                                className="px-1.5 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-bold"
                                title="গ বিভাগে পাঠান"
                              >
                                গ
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION B: খ বিভাগ (সংক্ষিপ্ত প্রশ্নাবলী) - শুধু প্রশ্ন থাকবে, টগল বা নতুন পেইজে উত্তর */}
          {/* ========================================================================= */}
          {(selectedSectionFilter === 'ALL' || selectedSectionFilter === 'B') && (
            <div className="space-y-4 pt-2">
              
              {/* Section Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 to-[#1B2A4A] text-white rounded-2xl shadow-md border-l-6 border-blue-400 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-400 text-blue-950 font-heading">
                      খ বিভাগ
                    </span>
                    <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white">
                      সংক্ষিপ্ত প্রশ্নাবলী (Part B)
                    </h3>
                  </div>
                  <p className="text-xs text-blue-100/90 font-body">
                    {SECTIONS_META.B.description} • <span className="font-bold text-amber-300">{SECTIONS_META.B.marksInfo}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExpandAllInSection(sectionBGroup, true)}
                    className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs font-heading transition cursor-pointer"
                  >
                    সব উত্তর খুলুন
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpandAllInSection(sectionBGroup, false)}
                    className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs font-heading transition cursor-pointer"
                  >
                    সব বন্ধ করুন
                  </button>
                </div>
              </div>

              {/* Items under Section B */}
              {sectionBGroup.length === 0 ? (
                <div className="notebook-sheet p-6 text-center rounded-xl border border-dashed border-[#D8CEB7] text-xs text-slate-500">
                  খ বিভাগে কোনো প্রশ্ন যুক্ত করা হয়নি।
                </div>
              ) : (
                <div className="space-y-3.5">
                  {sectionBGroup.map((sugg, index) => {
                    const inSuggestion = isIncludedInActiveSuggestion(sugg);
                    const importance = sugg.importance || 'high';
                    const isUpdating = updatingId === sugg.id;
                    const isExpanded = Boolean(expandedIds[sugg.id]);
                    const hasImages = sugg.imageUrls && sugg.imageUrls.length > 0;
                    const hasPdf = Boolean(sugg.pdfUrl);

                    return (
                      <div
                        key={sugg.id}
                        className="notebook-sheet relative p-5 sm:p-6 rounded-2xl border-2 border-[#E2D9C5] hover:border-blue-500 shadow-xs transition space-y-3"
                      >
                        {/* Red margin line */}
                        <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-red-400/40" />

                        <div className="pl-6 sm:pl-8 space-y-3">
                          
                          {/* Badges */}
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-md font-heading font-extrabold text-[10px] bg-blue-700 text-white shadow-2xs">
                                সংক্ষিপ্ত প্রশ্ন #{formatBnSerial(index + 1)}
                              </span>

                              {inSuggestion ? (
                                <span className="px-2 py-0.5 rounded-md font-heading font-bold text-[10px] bg-[#1B2A4A] text-[#F2A93B] flex items-center gap-1 shadow-2xs">
                                  <Sparkles className="w-3 h-3 text-[#F2A93B]" />
                                  {importance === 'high' ? '⭐⭐⭐ ৯৯% কমন' : importance === 'medium' ? '⭐⭐ ৯০% কমন' : '⭐ সাধারণ'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md font-heading font-bold text-[10px] bg-slate-200 text-slate-700">
                                  প্রশ্নব্যাংক
                                </span>
                              )}

                              {sugg.examYear && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-[#1B2A4A] px-2 py-0.5 rounded-md border border-[#F2A93B]/40">
                                  <Calendar className="w-3 h-3 text-[#F2A93B]" />
                                  বিগত {sugg.examYear}
                                </span>
                              )}

                              {hasImages && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#F2A93B]/20 text-[#1B2A4A] px-2 py-0.5 rounded-md">
                                  <ImageIcon className="w-3 h-3" />
                                  {sugg.imageUrls.length}টি খাতার ছবি
                                </span>
                              )}

                              {hasPdf && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#1B2A4A]/10 text-[#1B2A4A] px-2 py-0.5 rounded-md">
                                  <FileCheck className="w-3 h-3" />
                                  PDF
                                </span>
                              )}
                            </div>
                          </div>

                          {/* QUESTION TITLE */}
                          <div className="space-y-1">
                            <h4 className="font-heading text-base sm:text-lg font-extrabold text-[#1B2A4A] leading-snug">
                              {sugg.title}
                            </h4>
                          </div>

                          {/* ACTION BUTTONS: 1. Toggle Accordion, 2. Open Full Detail Page */}
                          <div className="flex items-center gap-2.5 flex-wrap pt-1">
                            {/* Toggle Button */}
                            <button
                              type="button"
                              onClick={() => toggleAccordion(sugg.id)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold font-heading flex items-center gap-2 transition cursor-pointer shadow-xs ${
                                isExpanded
                                  ? 'bg-[#1B2A4A] text-[#F2A93B]'
                                  : 'bg-[#FAF6EC] hover:bg-[#EAE2CE] text-[#1B2A4A] border border-[#D8CEB7]'
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff className="w-4 h-4 text-[#F2A93B]" />
                                  <span>উত্তর লুকিয়ে রাখুন</span>
                                  <ChevronUp className="w-4 h-4" />
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 text-[#F2A93B]" />
                                  <span>উত্তর দেখুন (টগল)</span>
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                </>
                              )}
                            </button>

                            {/* Open in Detail / Question Bank Answer Page */}
                            <button
                              type="button"
                              onClick={() => onSelectSuggestion(sugg)}
                              className="px-4 py-2 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] rounded-xl text-xs font-extrabold font-heading flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                            >
                              <span>সম্পূর্ণ উত্তর ও নোটস পেইজে দেখুন</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* TOGGLED ANSWER ACCORDION (যদি শিক্ষার্থী টগল করে) */}
                          {isExpanded && (
                            <div className="p-4 sm:p-5 bg-[#FFFDF7] rounded-xl border-2 border-blue-200 shadow-sm space-y-3 animate-fadeIn">
                              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                                <span className="text-xs font-bold text-blue-900 font-heading flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  প্রশ্নোত্তর ও লিখিত নোটস:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onSelectSuggestion(sugg)}
                                  className="text-xs font-bold text-[#1B2A4A] hover:underline flex items-center gap-1"
                                >
                                  পূর্ণাঙ্গ ভিউ &rarr;
                                </button>
                              </div>

                              <div className="text-xs sm:text-sm text-[#1B2A4A] font-body leading-relaxed">
                                <FormattedContent content={sugg.content} />
                              </div>

                              {(hasImages || hasPdf) && (
                                <div className="pt-2 border-t border-blue-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                                  <span>
                                    {hasImages && `📷 ${sugg.imageUrls.length}টি খাতার পাতার ছবি সংযুক্ত `}
                                    {hasPdf && `📄 PDF ফাইল সংযুক্ত`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onSelectSuggestion(sugg)}
                                    className="font-bold text-blue-800 underline"
                                  >
                                    ছবি ও PDF দেখতে বিস্তারিত পাতায় যান
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        </div>

                        {/* Admin Inline Management Toolbar */}
                        {isAdmin && (
                          <div className="pl-6 sm:pl-8 pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-[#EADFC8]/60 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={(e) => handleToggleSuggestion(e, sugg, inSuggestion)}
                                className={`px-2.5 py-1 rounded-lg font-heading font-bold text-[11px] flex items-center gap-1 transition ${
                                  inSuggestion
                                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                                    : 'bg-[#1B2A4A] text-[#F2A93B]'
                                }`}
                              >
                                {isUpdating ? '...' : inSuggestion ? 'সাজেশন থেকে বাদ দিন' : 'সাজেশনে যুক্ত করুন'}
                              </button>

                              {inSuggestion && (
                                <div className="flex items-center gap-1 bg-[#FAF6EC] p-0.5 rounded border border-[#D8CEB7]">
                                  <button
                                    type="button"
                                    onClick={(e) => handleChangeImportance(e, sugg, 'high')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${importance === 'high' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
                                  >
                                    ৯৯%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleChangeImportance(e, sugg, 'medium')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${importance === 'medium' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
                                  >
                                    ৯০%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleChangeImportance(e, sugg, 'normal')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${importance === 'normal' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
                                  >
                                    সাধারণ
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Move Section */}
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <span>বিভাগ পরিবর্তন:</span>
                              <button
                                type="button"
                                onClick={(e) => handleChangeSection(e, sugg, 'A')}
                                className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold"
                                title="ক বিভাগে পাঠান"
                              >
                                ক
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleChangeSection(e, sugg, 'C')}
                                className="px-1.5 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded font-bold"
                                title="গ বিভাগে পাঠান"
                              >
                                গ
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION C: গ বিভাগ (রচনামূলক প্রশ্নাবলী) - শুধু প্রশ্ন থাকবে, টগল বা নতুন পেইজে উত্তর */}
          {/* ========================================================================= */}
          {(selectedSectionFilter === 'ALL' || selectedSectionFilter === 'C') && (
            <div className="space-y-4 pt-2">
              
              {/* Section Header */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-purple-950 to-[#1B2A4A] text-white rounded-2xl shadow-md border-l-6 border-purple-400 flex items-center justify-between gap-3 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-400 text-purple-950 font-heading">
                      গ বিভাগ
                    </span>
                    <h3 className="font-heading font-extrabold text-lg sm:text-xl text-white">
                      রচনামূলক প্রশ্নাবলী (Part C)
                    </h3>
                  </div>
                  <p className="text-xs text-purple-100/90 font-body">
                    {SECTIONS_META.C.description} • <span className="font-bold text-amber-300">{SECTIONS_META.C.marksInfo}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleExpandAllInSection(sectionCGroup, true)}
                    className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs font-heading transition cursor-pointer"
                  >
                    সব উত্তর খুলুন
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExpandAllInSection(sectionCGroup, false)}
                    className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white font-bold rounded-xl text-xs font-heading transition cursor-pointer"
                  >
                    সব বন্ধ করুন
                  </button>
                </div>
              </div>

              {/* Items under Section C */}
              {sectionCGroup.length === 0 ? (
                <div className="notebook-sheet p-6 text-center rounded-xl border border-dashed border-[#D8CEB7] text-xs text-slate-500">
                  গ বিভাগে কোনো প্রশ্ন যুক্ত করা হয়নি।
                </div>
              ) : (
                <div className="space-y-3.5">
                  {sectionCGroup.map((sugg, index) => {
                    const inSuggestion = isIncludedInActiveSuggestion(sugg);
                    const importance = sugg.importance || 'high';
                    const isUpdating = updatingId === sugg.id;
                    const isExpanded = Boolean(expandedIds[sugg.id]);
                    const hasImages = sugg.imageUrls && sugg.imageUrls.length > 0;
                    const hasPdf = Boolean(sugg.pdfUrl);

                    return (
                      <div
                        key={sugg.id}
                        className="notebook-sheet relative p-5 sm:p-6 rounded-2xl border-2 border-[#E2D9C5] hover:border-purple-500 shadow-xs transition space-y-3"
                      >
                        {/* Red margin line */}
                        <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-0.5 bg-red-400/40" />

                        <div className="pl-6 sm:pl-8 space-y-3">
                          
                          {/* Badges */}
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 rounded-md font-heading font-extrabold text-[10px] bg-purple-700 text-white shadow-2xs">
                                রচনামূলক প্রশ্ন #{formatBnSerial(index + 1)}
                              </span>

                              {inSuggestion ? (
                                <span className="px-2 py-0.5 rounded-md font-heading font-bold text-[10px] bg-[#1B2A4A] text-[#F2A93B] flex items-center gap-1 shadow-2xs">
                                  <Sparkles className="w-3 h-3 text-[#F2A93B]" />
                                  {importance === 'high' ? '⭐⭐⭐ ৯৯% কমন' : importance === 'medium' ? '⭐⭐ ৯০% কমন' : '⭐ সাধারণ'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md font-heading font-bold text-[10px] bg-slate-200 text-slate-700">
                                  প্রশ্নব্যাংক
                                </span>
                              )}

                              {sugg.examYear && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-[#1B2A4A] px-2 py-0.5 rounded-md border border-[#F2A93B]/40">
                                  <Calendar className="w-3 h-3 text-[#F2A93B]" />
                                  বিগত {sugg.examYear}
                                </span>
                              )}

                              {hasImages && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#F2A93B]/20 text-[#1B2A4A] px-2 py-0.5 rounded-md">
                                  <ImageIcon className="w-3 h-3" />
                                  {sugg.imageUrls.length}টি খাতার ছবি
                                </span>
                              )}

                              {hasPdf && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#1B2A4A]/10 text-[#1B2A4A] px-2 py-0.5 rounded-md">
                                  <FileCheck className="w-3 h-3" />
                                  PDF
                                </span>
                              )}
                            </div>
                          </div>

                          {/* QUESTION TITLE */}
                          <div className="space-y-1">
                            <h4 className="font-heading text-base sm:text-lg font-extrabold text-[#1B2A4A] leading-snug">
                              {sugg.title}
                            </h4>
                          </div>

                          {/* ACTION BUTTONS: 1. Toggle Accordion, 2. Open Full Detail Page */}
                          <div className="flex items-center gap-2.5 flex-wrap pt-1">
                            {/* Toggle Button */}
                            <button
                              type="button"
                              onClick={() => toggleAccordion(sugg.id)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold font-heading flex items-center gap-2 transition cursor-pointer shadow-xs ${
                                isExpanded
                                  ? 'bg-[#1B2A4A] text-[#F2A93B]'
                                  : 'bg-[#FAF6EC] hover:bg-[#EAE2CE] text-[#1B2A4A] border border-[#D8CEB7]'
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  <EyeOff className="w-4 h-4 text-[#F2A93B]" />
                                  <span>উত্তর লুকিয়ে রাখুন</span>
                                  <ChevronUp className="w-4 h-4" />
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4 text-[#F2A93B]" />
                                  <span>উত্তর দেখুন (টগল)</span>
                                  <ChevronDown className="w-4 h-4 text-slate-500" />
                                </>
                              )}
                            </button>

                            {/* Open in Detail / Question Bank Answer Page */}
                            <button
                              type="button"
                              onClick={() => onSelectSuggestion(sugg)}
                              className="px-4 py-2 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] rounded-xl text-xs font-extrabold font-heading flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                            >
                              <span>সম্পূর্ণ উত্তর ও নোটস পেইজে দেখুন</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* TOGGLED ANSWER ACCORDION */}
                          {isExpanded && (
                            <div className="p-4 sm:p-5 bg-[#FFFDF7] rounded-xl border-2 border-purple-200 shadow-sm space-y-3 animate-fadeIn">
                              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                                <span className="text-xs font-bold text-purple-900 font-heading flex items-center gap-1.5">
                                  <FileText className="w-4 h-4 text-purple-600" />
                                  রচনামূলক উত্তর ও নোটস:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onSelectSuggestion(sugg)}
                                  className="text-xs font-bold text-[#1B2A4A] hover:underline flex items-center gap-1"
                                >
                                  পূর্ণাঙ্গ ভিউ &rarr;
                                </button>
                              </div>

                              <div className="text-xs sm:text-sm text-[#1B2A4A] font-body leading-relaxed">
                                <FormattedContent content={sugg.content} />
                              </div>

                              {(hasImages || hasPdf) && (
                                <div className="pt-2 border-t border-purple-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
                                  <span>
                                    {hasImages && `📷 ${sugg.imageUrls.length}টি খাতার পাতার ছবি সংযুক্ত `}
                                    {hasPdf && `📄 PDF ফাইল সংযুক্ত`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onSelectSuggestion(sugg)}
                                    className="font-bold text-purple-800 underline"
                                  >
                                    ছবি ও PDF দেখতে বিস্তারিত পাতায় যান
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                        </div>

                        {/* Admin Inline Management Toolbar */}
                        {isAdmin && (
                          <div className="pl-6 sm:pl-8 pt-2 flex items-center justify-between gap-2 flex-wrap border-t border-[#EADFC8]/60 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={(e) => handleToggleSuggestion(e, sugg, inSuggestion)}
                                className={`px-2.5 py-1 rounded-lg font-heading font-bold text-[11px] flex items-center gap-1 transition ${
                                  inSuggestion
                                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                                    : 'bg-[#1B2A4A] text-[#F2A93B]'
                                }`}
                              >
                                {isUpdating ? '...' : inSuggestion ? 'সাজেশন থেকে বাদ দিন' : 'সাজেশনে যুক্ত করুন'}
                              </button>

                              {inSuggestion && (
                                <div className="flex items-center gap-1 bg-[#FAF6EC] p-0.5 rounded border border-[#D8CEB7]">
                                  <button
                                    type="button"
                                    onClick={(e) => handleChangeImportance(e, sugg, 'high')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${importance === 'high' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
                                  >
                                    ৯৯%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleChangeImportance(e, sugg, 'medium')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${importance === 'medium' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
                                  >
                                    ৯০%
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleChangeImportance(e, sugg, 'normal')}
                                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${importance === 'normal' ? 'bg-amber-500 text-white' : 'text-slate-600'}`}
                                  >
                                    সাধারণ
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Move Section */}
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                              <span>বিভাগ পরিবর্তন:</span>
                              <button
                                type="button"
                                onClick={(e) => handleChangeSection(e, sugg, 'A')}
                                className="px-1.5 py-0.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded font-bold"
                                title="ক বিভাগে পাঠান"
                              >
                                ক
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleChangeSection(e, sugg, 'B')}
                                className="px-1.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded font-bold"
                                title="খ বিভাগে পাঠান"
                              >
                                খ
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* Add New Suggestion / Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF6EC] border-2 border-[#F2A93B] rounded-2xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-black rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold bg-[#1B2A4A] text-[#F2A93B] px-2.5 py-0.5 rounded-full font-heading">
                {selectedSubject.name}
              </span>
              <h3 className="font-heading font-extrabold text-xl text-[#1B2A4A]">
                নতুন প্রশ্ন ও উত্তর যুক্ত করুন
              </h3>
              <p className="text-xs text-slate-600 font-body">
                প্রশ্নের বিভাগ (ক/খ/গ) নির্বাচন করুন এবং উত্তর ও নোটস যুক্ত করুন।
              </p>
            </div>

            {/* Quick Bulk Import Banner */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <ListPlus className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-emerald-950 font-heading">
                    ক বিভাগের ৪০-১০০টি প্রশ্ন একসাথে পেস্ট করতে চান?
                  </p>
                  <p className="text-[10px] text-emerald-800 font-body">
                    বাল্ক ইমপোর্টে এক ক্লিকে সম্পূর্ণ শিটের সকল প্রশ্ন ও উত্তর আলাদা হয়ে সেভ হবে।
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setBulkInitialSection('A');
                  setIsBulkModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-lg text-xs font-heading shadow-xs transition shrink-0 cursor-pointer"
              >
                বাল্ক পেস্ট ওপেন করুন
              </button>
            </div>

            <form onSubmit={handleCreateNew} className="space-y-4">
              
              {/* SECTION SELECTOR (ক বিভাগ / খ বিভাগ / গ বিভাগ) */}
              <div className="p-3.5 bg-white border border-[#D8CEB7] rounded-xl space-y-2">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#F2A93B]" />
                  প্রশ্নের বিভাগ নির্বাচন করুন (Part Selection):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSection('A')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      newSection === 'A'
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'bg-white border-[#D8CEB7] text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-extrabold text-xs font-heading flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      ক বিভাগ
                    </span>
                    <span className="text-[10px] text-slate-500 font-body">অতিসংক্ষিপ্ত (১ মান)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSection('B')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      newSection === 'B'
                        ? 'bg-blue-50 border-blue-600 text-blue-950 ring-2 ring-blue-500/20'
                        : 'bg-white border-[#D8CEB7] text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-extrabold text-xs font-heading flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      খ বিভাগ
                    </span>
                    <span className="text-[10px] text-slate-500 font-body">সংক্ষিপ্ত (৪ মান)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSection('C')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      newSection === 'C'
                        ? 'bg-purple-50 border-purple-600 text-purple-950 ring-2 ring-purple-500/20'
                        : 'bg-white border-[#D8CEB7] text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-extrabold text-xs font-heading flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      গ বিভাগ
                    </span>
                    <span className="text-[10px] text-slate-500 font-body">রচনামূলক (১০ মান)</span>
                  </button>
                </div>
              </div>

              {/* Question Inclusion Toggle in Form */}
              <div className="p-3.5 bg-white border border-[#D8CEB7] rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#F2A93B]" />
                    <div>
                      <label className="text-xs font-bold text-[#1B2A4A] font-heading cursor-pointer">
                        চলতি চূড়ান্ত সাজেশনে অন্তর্ভুক্ত রাখুন
                      </label>
                      <p className="text-[10px] text-slate-500 font-body">
                        টিক চিহ্ন দেওয়া থাকলে প্রশ্নটি সরাসরি চলতি বছরের চূড়ান্ত সাজেশনে প্রদর্শিত হবে।
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={newInSuggestion}
                    onChange={(e) => setNewInSuggestion(e.target.checked)}
                    className="w-5 h-5 accent-[#1B2A4A] cursor-pointer"
                  />
                </div>

                {newInSuggestion && (
                  <div className="pt-2 border-t border-[#EAE2CE] flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#1B2A4A] font-heading">
                      সাজেশনের গুরুত্ব স্তর:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewImportance('high')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          newImportance === 'high'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-[#D8CEB7]'
                        }`}
                      >
                        ⭐⭐⭐ ৯৯% কমন
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewImportance('medium')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          newImportance === 'medium'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-[#D8CEB7]'
                        }`}
                      >
                        ⭐⭐ ৯০% কমন
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewImportance('normal')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          newImportance === 'normal'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-[#D8CEB7]'
                        }`}
                      >
                        ⭐ সাধারণ
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Exam Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                    প্রশ্নের শিরোনাম / প্রশ্ন:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: ১. ১৯৬৬ সালের ৬-দফা দাবির পটভূমি ও গুরুত্ব আলোচনা কর।"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                    বিগত পরীক্ষার সাল (ঐচ্ছিক):
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ২০২০, ২০২২"
                    value={newExamYear}
                    onChange={(e) => setNewExamYear(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                  />
                </div>
              </div>

              {/* Content & Markdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  বিস্তারিত উত্তর ও নোট (Content):
                </label>

                <LinkInsertToolbar
                  textareaRef={newContentRef}
                  value={newContent}
                  onChange={setNewContent}
                />

                <textarea
                  ref={newContentRef}
                  required
                  rows={6}
                  placeholder="সম্পূর্ণ উত্তর বা পাঠ্যপুস্তকের নোট এখানে লিখুন..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none font-body leading-relaxed"
                />
              </div>

              {/* Images Management */}
              <div className="p-3 bg-white border border-[#D8CEB7] rounded-xl space-y-3">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading flex items-center justify-between">
                  <span>খাতার পাতার ছবি যুক্ত করুন (ঐচ্ছিক / Optional)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({imageUrls.length}টি যুক্ত হয়েছে)
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-[#FAF6EC] hover:bg-amber-50 border border-dashed border-[#F2A93B] px-3 py-2 rounded-xl text-xs font-bold text-[#1B2A4A] text-center transition flex items-center justify-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#F2A93B]" />
                    ছবি আপলোড করুন
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUploadImage}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="অথবা ইমেজের Direct URL লিঙ্ক দিন..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#FAF6EC] border border-[#D8CEB7] rounded-lg text-xs text-[#1B2A4A] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrlInput.trim()) {
                        setImageUrls([...imageUrls, imageUrlInput.trim()]);
                        setImageUrlInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-[#1B2A4A] text-[#F2A93B] rounded-lg text-xs font-bold"
                  >
                    যুক্ত
                  </button>
                </div>

                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {imageUrls.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg border border-[#D8CEB7] overflow-hidden bg-white">
                        <img src={url} alt="Note page" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PDF Management */}
              <div className="p-3 bg-white border border-[#D8CEB7] rounded-xl space-y-2">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading flex items-center justify-between">
                  <span>PDF ফাইল সংযুক্ত করুন (ঐচ্ছিক / Optional):</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (অফলাইন পড়া / ডাউনলোড)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-[#FAF6EC] hover:bg-amber-50 border border-dashed border-[#F2A93B] px-3 py-1.5 rounded-lg text-xs font-bold text-[#1B2A4A] text-center transition shrink-0">
                    <FileDown className="w-4 h-4 text-[#F2A93B] inline mr-1" />
                    PDF আপলোড
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileUploadPdf}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    placeholder="অথবা PDF URL লিঙ্ক দিন (ঐচ্ছিক - https://...)"
                    value={pdfUrl}
                    onChange={(e) => setPdfUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#FAF6EC] border border-[#D8CEB7] rounded-lg text-xs text-[#1B2A4A] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D8CEB7]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Bulk Section A Import Modal (৪০-১০০টি প্রশ্ন একসাথে পেস্ট) */}
      <BulkSectionAImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedSubject={selectedSubject}
        initialSection={bulkInitialSection}
        onSuccess={(count) => {
          showToast(`সফলভাবে ${count}টি প্রশ্ন ক বিভাগে যুক্ত করা হয়েছে!`);
          setActiveTab('suggestion');
        }}
      />

      {/* Question Bank Manager Modal */}
      <QuestionBankManagerModal
        isOpen={isBankManagerOpen}
        onClose={() => setIsBankManagerOpen(false)}
        selectedSubject={selectedSubject}
        suggestions={suggestions}
        onToggleSuccess={showToast}
      />

      {/* Question Picker Modal */}
      <QuestionPickerModal
        isOpen={isQuestionPickerOpen}
        onClose={() => setIsQuestionPickerOpen(false)}
        currentSubjectId={selectedSubject.id}
        allSuggestions={allSuggestions.length > 0 ? allSuggestions : suggestions}
        subjects={allSubjects.length > 0 ? allSubjects : [selectedSubject]}
        onSelectQuestion={handleSelectQuestionFromPicker}
      />

    </div>
  );
};
