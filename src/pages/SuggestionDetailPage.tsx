import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  FileDown, 
  Lock, 
  LogIn, 
  X, 
  Maximize2, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Share2, 
  Edit3, 
  Save, 
  Upload, 
  Trash2, 
  Sparkles, 
  Star,
  Plus,
  Minus,
  Calendar,
  Layers,
  BookOpen
} from 'lucide-react';
import { Suggestion, Subject, ActiveView } from '../types';
import { useAuth } from '../context/AuthContext';
import { updateSuggestion, deleteSuggestion } from '../services/db';
import { FormattedContent } from '../components/FormattedContent';
import { LinkInsertToolbar } from '../components/LinkInsertToolbar';
import { isIncludedInActiveSuggestion } from '../components/QuestionBankManagerModal';
import { SuggestionSection, SECTIONS_META, getSuggestionSection } from '../utils/sectionHelper';

interface SuggestionDetailPageProps {
  suggestion: Suggestion;
  selectedSubject: Subject | null;
  setActiveView: (view: ActiveView) => void;
}

export const SuggestionDetailPage: React.FC<SuggestionDetailPageProps> = ({
  suggestion,
  selectedSubject,
  setActiveView,
}) => {
  const { user, isAdmin } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Admin Quick Edit Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(suggestion.title);
  const [editContent, setEditContent] = useState(suggestion.content);
  const editContentRef = useRef<HTMLTextAreaElement>(null);
  const [editSection, setEditSection] = useState<SuggestionSection>(getSuggestionSection(suggestion));
  const [editExamYear, setEditExamYear] = useState(suggestion.examYear || '');
  const [editInSuggestion, setEditInSuggestion] = useState(isIncludedInActiveSuggestion(suggestion));
  const [editImportance, setEditImportance] = useState<'high' | 'medium' | 'normal'>(suggestion.importance || 'high');
  const [editImageUrls, setEditImageUrls] = useState<string[]>(suggestion.imageUrls || []);
  const [editPdfUrl, setEditPdfUrl] = useState(suggestion.pdfUrl || '');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [updatingInclusion, setUpdatingInclusion] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const inSuggestion = isIncludedInActiveSuggestion(suggestion);
  const importance = suggestion.importance || 'high';

  const handleToggleInclusion = async () => {
    if (!isAdmin) return;
    setUpdatingInclusion(true);
    try {
      const nextIn = !inSuggestion;
      await updateSuggestion(suggestion.id, {
        inSuggestion: nextIn,
        importance: nextIn ? (suggestion.importance || 'high') : suggestion.importance,
        contentType: nextIn ? 'suggestion' : 'question'
      });
      suggestion.inSuggestion = nextIn;
      suggestion.contentType = nextIn ? 'suggestion' : 'question';
      showToast(
        nextIn
          ? 'এই প্রশ্নটি সফলভাবে চলতি চূড়ান্ত সাজেশনে যুক্ত করা হয়েছে!'
          : 'এই প্রশ্নটি চলতি সাজেশন থেকে বাদ দেওয়া হয়েছে (প্রশ্নব্যাংকে সংরক্ষিত আছে)!'
      );
    } catch (err: any) {
      alert('স্ট্যাটাস পরিবর্তন ব্যর্থ: ' + err.message);
    } finally {
      setUpdatingInclusion(false);
    }
  };

  const handleChangeImportance = async (newImp: 'high' | 'medium' | 'normal') => {
    if (!isAdmin) return;
    try {
      await updateSuggestion(suggestion.id, {
        inSuggestion: true,
        importance: newImp
      });
      suggestion.inSuggestion = true;
      suggestion.importance = newImp;
      showToast('গুরুত্ব স্তর আপডেট করা হয়েছে!');
    } catch (err: any) {
      alert('আপডেট ব্যর্থ: ' + err.message);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: suggestion.title,
        text: `ডিগ্রি পরীক্ষা সাজেশন: ${suggestion.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenEdit = () => {
    setEditTitle(suggestion.title);
    setEditContent(suggestion.content);
    setEditSection(getSuggestionSection(suggestion));
    setEditExamYear(suggestion.examYear || '');
    setEditInSuggestion(isIncludedInActiveSuggestion(suggestion));
    setEditImportance(suggestion.importance || 'high');
    setEditImageUrls(suggestion.imageUrls || []);
    setEditPdfUrl(suggestion.pdfUrl || '');
    setIsEditModalOpen(true);
  };

  const handleFileUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setEditImageUrls(prev => [...prev, reader.result as string]);
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
        setEditPdfUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSuggestion(suggestion.id, {
        title: editTitle,
        content: editContent,
        section: editSection,
        examYear: editExamYear.trim() || undefined,
        inSuggestion: editInSuggestion,
        importance: editImportance,
        imageUrls: editImageUrls,
        pdfUrl: editPdfUrl.trim() || undefined,
        contentType: editInSuggestion ? 'suggestion' : 'question'
      });

      // Update local cache
      suggestion.title = editTitle;
      suggestion.content = editContent;
      suggestion.section = editSection;
      suggestion.examYear = editExamYear.trim() || undefined;
      suggestion.inSuggestion = editInSuggestion;
      suggestion.importance = editImportance;
      suggestion.imageUrls = editImageUrls;
      suggestion.pdfUrl = editPdfUrl.trim() || undefined;
      suggestion.contentType = editInSuggestion ? 'suggestion' : 'question';

      showToast('তথ্য সফলভাবে আপডেট হয়েছে!');
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert('আপডেট করতে ব্যর্থ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('আপনি কি এই প্রশ্ন/সাজেশনটি সম্পূর্ণ মুছে ফেলতে চান?')) return;
    try {
      await deleteSuggestion(suggestion.id);
      setActiveView('suggestions');
    } catch (err: any) {
      alert('মুছে ফেলতে সমস্যা: ' + err.message);
    }
  };

  const hasImages = suggestion.imageUrls && suggestion.imageUrls.length > 0;
  const hasPdf = Boolean(suggestion.pdfUrl);

  return (
    <div className="space-y-6 pb-16">
      
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-xl shadow-xl border bg-[#1B2A4A] text-[#F2A93B] border-[#F2A93B] text-xs font-bold flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-[#F2A93B]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Title & Status Card */}
      <div className="notebook-sheet p-6 sm:p-8 rounded-2xl border-2 border-[#E2D9C5] space-y-4 relative">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {selectedSubject && (
            <span className="px-3 py-1 bg-[#1B2A4A] text-[#F2A93B] font-bold text-xs font-heading rounded-full flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              {selectedSubject.name}
            </span>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {isAdmin && (
              <button
                type="button"
                onClick={handleOpenEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                এডমিন এডিট
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6EC] hover:bg-[#EAE2CE] text-[#1B2A4A] border border-[#D8CEB7] rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#F2A93B]" />
              {copied ? 'লিঙ্ক কপি হয়েছে!' : 'শেয়ার করুন'}
            </button>
          </div>
        </div>

        {/* Suggestion Status Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Section Badge */}
          {(() => {
            const sec = getSuggestionSection(suggestion);
            const meta = SECTIONS_META[sec];
            return (
              <span className={`px-3 py-1 rounded-lg font-heading font-extrabold text-xs ${meta.badgeBg} ${meta.badgeText} shadow-2xs`}>
                {meta.name} • {meta.typeLabel}
              </span>
            );
          })()}

          {inSuggestion ? (
            <span className="px-3 py-1 rounded-lg font-heading font-extrabold text-xs bg-[#1B2A4A] text-[#F2A93B] flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#F2A93B]" />
              {importance === 'high' ? '⭐⭐⭐ ৯৯% কমন সাজেশন' : importance === 'medium' ? '⭐⭐ ৯০% কমন সাজেশন' : '⭐ সাধারণ সাজেশন'}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-lg font-heading font-bold text-xs bg-slate-200 text-slate-700">
              শুধুমাত্র প্রশ্নব্যাংকে সংরক্ষিত
            </span>
          )}

          {suggestion.examYear && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-[#1B2A4A] px-2.5 py-1 rounded-lg border border-[#F2A93B]/40">
              <Calendar className="w-3.5 h-3.5 text-[#F2A93B]" />
              বিগত {suggestion.examYear} সালের পরীক্ষা
            </span>
          )}

          {hasImages && <span className="text-xs text-[#1B2A4A] font-bold">📷 {suggestion.imageUrls.length}টি খাতার ছবি</span>}
          {hasPdf && <span className="text-xs text-[#1B2A4A] font-bold">📄 PDF ফাইল সংযুক্ত</span>}
        </div>

        {/* Question Title */}
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B2A4A] leading-snug">
          {suggestion.title}
        </h2>

        {/* Admin 1-Click Inclusion & Importance Toolbar */}
        {isAdmin && (
          <div className="p-3 bg-[#FAF6EC] border border-[#D8CEB7] rounded-xl flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={updatingInclusion}
                onClick={handleToggleInclusion}
                className={`px-3.5 py-1.5 rounded-xl font-heading font-extrabold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer ${
                  inSuggestion
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-300'
                    : 'bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B]'
                }`}
              >
                {updatingInclusion ? (
                  '...'
                ) : inSuggestion ? (
                  <>
                    <Minus className="w-3.5 h-3.5 text-rose-600" />
                    চলতি সাজেশন থেকে বাদ দিন
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-[#F2A93B]" />
                    চলতি চূড়ান্ত সাজেশনে যুক্ত করুন
                  </>
                )}
              </button>

              <span className="text-[11px] text-slate-500 font-body hidden sm:inline">
                {inSuggestion ? 'ছাত্র-ছাত্রীরা এটি চূড়ান্ত সাজেশনে দেখতে পাবে।' : 'এটি শুধু প্রশ্নব্যাংকে থাকবে।'}
              </span>
            </div>

            {inSuggestion && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-600 font-heading">গুরুত্ব:</span>
                <button
                  type="button"
                  onClick={() => handleChangeImportance('high')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    importance === 'high' ? 'bg-amber-500 text-white shadow-2xs' : 'bg-white text-slate-700 border border-[#D8CEB7]'
                  }`}
                >
                  ⭐⭐⭐ ৯৯%
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeImportance('medium')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    importance === 'medium' ? 'bg-amber-500 text-white shadow-2xs' : 'bg-white text-slate-700 border border-[#D8CEB7]'
                  }`}
                >
                  ⭐⭐ ৯০%
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeImportance('normal')}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                    importance === 'normal' ? 'bg-amber-500 text-white shadow-2xs' : 'bg-white text-slate-700 border border-[#D8CEB7]'
                  }`}
                >
                  ⭐ সাধারণ
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Text Content - Open to EVERYONE FREE */}
      <div className="notebook-sheet p-6 sm:p-8 rounded-2xl border-2 border-[#E2D9C5] space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EADFC8]">
          <FileText className="w-5 h-5 text-[#F2A93B]" />
          <h3 className="font-heading font-extrabold text-lg text-[#1B2A4A]">
            প্রশ্ন ও লিখিত উত্তর (Question & Full Answer)
          </h3>
          <span className="ml-auto text-[10px] font-bold bg-green-700 text-white px-2 py-0.5 rounded-full">
            সবার জন্য ফ্রি
          </span>
        </div>

        {/* Lined Notebook Page Text Layout */}
        <div className="notebook-lined p-4 sm:p-6 rounded-xl border border-[#EADFC8] text-[#1B2A4A] font-body text-base">
          <FormattedContent content={suggestion.content} />
        </div>
      </div>

      {/* Attachments Section: Gated for Logged In Users */}
      <div className="notebook-sheet p-6 sm:p-8 rounded-2xl border-2 border-[#E2D9C5] space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-[#EADFC8]">
          <ImageIcon className="w-5 h-5 text-[#F2A93B]" />
          <h3 className="font-heading font-extrabold text-lg text-[#1B2A4A]">
            সংযুক্ত খাতার ছবি ও PDF ফাইল (Attachments)
          </h3>
        </div>

        {/* IF USER IS NOT LOGGED IN -> SHOW LOG-IN GATE MESSAGE */}
        {!user ? (
          <div className="p-6 sm:p-8 bg-[#FAF6EC] border-2 border-dashed border-[#F2A93B] rounded-2xl text-center space-y-4">
            <div className="w-14 h-14 bg-[#1B2A4A] text-[#F2A93B] rounded-full flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="font-heading text-xl font-bold text-[#1B2A4A]">
                ছবি দেখতে এবং PDF ডাউনলোড করতে ইমেইল দিয়ে সাইনআপ বা লগইন করুন
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto font-body">
                সাজেশনের মূল লিখিত উত্তরটি সবার জন্য সম্পূর্ণ উন্মুক্ত। তবে সংযুক্ত হ্যান্ডনোটসের ছবি ও PDF ডাউনলোড করার জন্য একটি ফ্রি একাউন্টে লগইন থাকা আবশ্যক।
              </p>
            </div>

            <button
              onClick={() => setActiveView('login')}
              className="inline-flex items-center gap-2 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] font-bold px-6 py-3 rounded-xl text-sm shadow-md transition transform hover:-translate-y-0.5"
            >
              <LogIn className="w-5 h-5" />
              লগইন / সাইনআপ করুন
            </button>
          </div>
        ) : (
          /* IF USER IS LOGGED IN -> SHOW IMAGES AND PDF DOWNLOAD */
          <div className="space-y-6">
            
            {/* Images Gallery */}
            <div>
              <h4 className="font-heading font-bold text-base text-[#1B2A4A] mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#F2A93B]" />
                নোটস ও পেজের ছবিসমূহ ({suggestion.imageUrls?.length || 0}টি)
              </h4>

              {!hasImages ? (
                <p className="text-xs text-slate-500 bg-[#FAF6EC] p-4 rounded-xl border border-[#D8CEB7]">
                  এই সাজেশনের সাথে কোনো ছবি যুক্ত করা হয়নি।
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {suggestion.imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className="group relative aspect-4/3 rounded-xl overflow-hidden border-2 border-[#D8CEB7] cursor-pointer bg-[#FAF6EC] hover:border-[#F2A93B] transition shadow-xs"
                    >
                      <img
                        src={url}
                        alt={`Note page ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-[#1B2A4A]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-6 h-6 text-[#F2A93B]" />
                      </div>
                      <span className="absolute bottom-2 left-2 bg-[#1B2A4A]/80 text-[#FAF6EC] text-[10px] font-bold px-2 py-0.5 rounded-md">
                        ছবি #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PDF File Section */}
            <div className="pt-4 border-t border-[#EADFC8]">
              <h4 className="font-heading font-bold text-base text-[#1B2A4A] mb-3 flex items-center gap-2">
                <FileDown className="w-4 h-4 text-[#F2A93B]" />
                অফলাইন PDF ফাইল
              </h4>

              {!hasPdf ? (
                <p className="text-xs text-slate-500 bg-[#FAF6EC] p-4 rounded-xl border border-[#D8CEB7]">
                  এই সাজেশনের জন্য কোনো PDF ফাইল যুক্ত করা হয়নি।
                </p>
              ) : (
                <div className="p-4 bg-[#FAF6EC] border-2 border-[#F2A93B]/40 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-[#1B2A4A] text-[#F2A93B] rounded-xl font-bold text-xs">
                      PDF
                    </div>
                    <div>
                      <h5 className="font-heading font-bold text-[#1B2A4A] text-sm">
                        {suggestion.title} - সম্পূর্ণ সাজেশন PDF
                      </h5>
                      <p className="text-xs text-slate-500 font-body">
                        প্রিন্ট করা বা অফলাইনে রিড করার উপযোগী
                      </p>
                    </div>
                  </div>

                  <a
                    href={suggestion.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] font-bold px-5 py-2.5 rounded-xl text-xs shadow-sm transition"
                  >
                    <Download className="w-4 h-4" />
                    PDF ডাউনলোড বা ভিউ করুন
                  </a>
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Lightbox Modal for Image Zoom */}
      {selectedImageIndex !== null && suggestion.imageUrls && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
            title="বন্ধ করুন"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Previous / Next buttons */}
          {suggestion.imageUrls.length > 1 && (
            <>
              <button
                onClick={() =>
                  setSelectedImageIndex(
                    (selectedImageIndex - 1 + suggestion.imageUrls.length) % suggestion.imageUrls.length
                  )
                }
                className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={() =>
                  setSelectedImageIndex((selectedImageIndex + 1) % suggestion.imageUrls.length)
                }
                className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <div className="max-w-4xl max-h-[85vh] space-y-2 text-center">
            <img
              src={suggestion.imageUrls[selectedImageIndex]}
              alt={`Full view ${selectedImageIndex + 1}`}
              className="max-h-[75vh] max-w-full mx-auto object-contain rounded-lg border border-white/20"
            />
            <div className="flex items-center justify-center gap-4 text-white text-xs">
              <span>
                ছবি {selectedImageIndex + 1} / {suggestion.imageUrls.length}
              </span>
              <a
                href={suggestion.imageUrls[selectedImageIndex]}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-1 bg-[#F2A93B] text-[#1B2A4A] font-bold px-3 py-1 rounded-md text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                ছবি ডাউনলোড
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#FAF6EC] border-2 border-[#F2A93B] rounded-2xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl relative my-8">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-500 hover:text-black rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold bg-[#F2A93B] text-[#1B2A4A] px-2 py-0.5 rounded-full font-heading">
                এডমিন প্যানেল ইডিটর
              </span>
              <h3 className="font-heading font-extrabold text-xl text-[#1B2A4A]">
                প্রশ্ন ও সাজেশনের তথ্য সম্পাদনা
              </h3>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* SECTION SELECTOR */}
              <div className="p-3.5 bg-white border border-[#D8CEB7] rounded-xl space-y-2">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#F2A93B]" />
                  বিভাগ নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditSection('A')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      editSection === 'A'
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
                    onClick={() => setEditSection('B')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      editSection === 'B'
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
                    onClick={() => setEditSection('C')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                      editSection === 'C'
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

              {/* Inclusion & Importance Toggle */}
              <div className="p-3.5 bg-white border border-[#D8CEB7] rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#F2A93B]" />
                    <div>
                      <label className="text-xs font-bold text-[#1B2A4A] font-heading cursor-pointer">
                        চলতি চূড়ান্ত সাজেশনে অন্তর্ভুক্ত রাখুন
                      </label>
                      <p className="text-[10px] text-slate-500 font-body">
                        টিক চিহ্ন তুলে দিলে এটি শুধু প্রশ্নব্যাংকে থাকবে, চলতি সাজেশনে দেখাবে না।
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={editInSuggestion}
                    onChange={(e) => setEditInSuggestion(e.target.checked)}
                    className="w-5 h-5 accent-[#1B2A4A] cursor-pointer"
                  />
                </div>

                {editInSuggestion && (
                  <div className="pt-2 border-t border-[#EAE2CE] flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#1B2A4A] font-heading">
                      সাজেশনের গুরুত্ব স্তর:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditImportance('high')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          editImportance === 'high'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-[#D8CEB7]'
                        }`}
                      >
                        ⭐⭐⭐ ৯৯% কমন
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditImportance('medium')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          editImportance === 'medium'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-[#D8CEB7]'
                        }`}
                      >
                        ⭐⭐ ৯০% কমন
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditImportance('normal')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
                          editImportance === 'normal'
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
                    শিরোনাম / প্রশ্ন:
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                    বিগত পরীক্ষার সাল:
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: ২০২০, ২০২২"
                    value={editExamYear}
                    onChange={(e) => setEditExamYear(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                    বিস্তারিত লেখা ও উত্তর (Content Text):
                  </label>
                </div>

                <LinkInsertToolbar
                  textareaRef={editContentRef}
                  value={editContent}
                  onChange={setEditContent}
                />

                <textarea
                  ref={editContentRef}
                  required
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none font-body leading-relaxed"
                />
              </div>

              {/* Images Management */}
              <div className="p-3 bg-white border border-[#D8CEB7] rounded-xl space-y-3">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading flex items-center justify-between">
                  <span>ছবি যুক্ত করুন (ঐচ্ছিক / Optional)</span>
                  <span className="text-[10px] text-slate-500 font-normal">({editImageUrls.length}টি)</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-[#FAF6EC] hover:bg-amber-50 border border-dashed border-[#F2A93B] px-3 py-2 rounded-xl text-xs font-bold text-[#1B2A4A] text-center transition flex items-center justify-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#F2A93B]" />
                    ছবি আপলোড
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
                    placeholder="অথবা ইমেজের লিঙ্ক/URL লিখুন..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#FAF6EC] border border-[#D8CEB7] rounded-lg text-xs text-[#1B2A4A] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrlInput.trim()) {
                        setEditImageUrls([...editImageUrls, imageUrlInput.trim()]);
                        setImageUrlInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-[#1B2A4A] text-[#F2A93B] rounded-lg text-xs font-bold"
                  >
                    যুক্ত
                  </button>
                </div>

                {editImageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {editImageUrls.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg border border-[#D8CEB7] overflow-hidden bg-white">
                        <img src={url} alt="Note page" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditImageUrls(editImageUrls.filter((_, i) => i !== idx))}
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
                  <span>PDF ফাইল লিঙ্ক (ঐচ্ছিক / Optional):</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer bg-[#FAF6EC] hover:bg-amber-50 border border-dashed border-[#F2A93B] px-3 py-1.5 rounded-lg text-xs font-bold text-[#1B2A4A] text-center transition shrink-0">
                    <FileDown className="w-4 h-4 text-[#F2A93B]" />
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
                    placeholder="https://... (ঐচ্ছিক)"
                    value={editPdfUrl}
                    onChange={(e) => setEditPdfUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#FAF6EC] border border-[#D8CEB7] rounded-lg text-xs text-[#1B2A4A] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#D8CEB7]">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1 bg-red-100 hover:bg-red-600 hover:text-white text-red-600 font-bold px-3 py-2.5 rounded-xl text-xs transition"
                >
                  <Trash2 className="w-4 h-4" />
                  মুছে ফেলুন
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold px-5 py-2.5 rounded-xl text-xs transition shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
