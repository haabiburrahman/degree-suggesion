import React, { useState, useRef } from 'react';
import { 
  ShieldAlert, 
  Calendar, 
  Layers, 
  BookOpen, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Upload, 
  Image as ImageIcon, 
  FileDown,
  RefreshCw,
  Check,
  AlertTriangle,
  Lock,
  Sparkles,
  HelpCircle,
  Copy,
  ListPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FormattedContent } from '../components/FormattedContent';
import { LinkInsertToolbar } from '../components/LinkInsertToolbar';
import { QuestionPickerModal } from '../components/QuestionPickerModal';
import { BulkSectionAImportModal } from '../components/BulkSectionAImportModal';
import { Year, Department, Subject, Suggestion, ActiveView } from '../types';
import { 
  addYear, updateYear, deleteYear,
  addDepartment, updateDepartment, deleteDepartment,
  addSubject, updateSubject, deleteSubject,
  addSuggestion, updateSuggestion, deleteSuggestion,
  seedInitialSampleData
} from '../services/db';
import { SuggestionSection, SECTIONS_META, getSuggestionSection } from '../utils/sectionHelper';

interface AdminDashboardPageProps {
  years: Year[];
  departments: Department[];
  subjects: Subject[];
  suggestions: Suggestion[];
  setActiveView: (view: ActiveView) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  years,
  departments,
  subjects,
  suggestions,
  setActiveView,
}) => {
  const { user, profile, isAdmin, makeAdmin } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'years' | 'departments' | 'subjects' | 'suggestions'>('years');
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ==================== YEAR STATE ====================
  const [yearName, setYearName] = useState('');
  const [yearOrder, setYearOrder] = useState<number>(1);
  const [editingYearId, setEditingYearId] = useState<string | null>(null);

  // ==================== DEPARTMENT STATE ====================
  const [deptName, setDeptName] = useState('');
  const [deptCode, setDeptCode] = useState('');
  const [deptOrder, setDeptOrder] = useState<number>(1);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);

  // ==================== SUBJECT STATE ====================
  const [subjectName, setSubjectName] = useState('');
  const [subYearId, setSubYearId] = useState('');
  const [subDeptId, setSubDeptId] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);

  // ==================== SUGGESTION STATE ====================
  const [suggSubjectId, setSuggSubjectId] = useState('');
  const [suggTitle, setSuggTitle] = useState('');
  const [suggContent, setSuggContent] = useState('');
  const suggContentRef = useRef<HTMLTextAreaElement>(null);
  const [suggSection, setSuggSection] = useState<SuggestionSection>('A');
  const [suggImageUrls, setSuggImageUrls] = useState<string[]>([]);
  const [suggPdfUrl, setSuggPdfUrl] = useState('');
  const [suggContentType, setSuggContentType] = useState<'suggestion' | 'question'>('suggestion');
  const [editingSuggId, setEditingSuggId] = useState<string | null>(null);
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [adminSuggFilterTab, setAdminSuggFilterTab] = useState<'all' | 'suggestion' | 'question'>('all');
  
  // Image & PDF input helpers
  const [imageUrlInput, setImageUrlInput] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // If user is not admin
  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="notebook-sheet p-8 rounded-2xl border-2 border-red-300 text-center space-y-5">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="font-heading text-2xl font-bold text-[#1B2A4A]">
              এডমিন অনুমতি সংরক্ষিত
            </h3>
            <p className="text-xs text-slate-600 font-body">
              এই পেজটি শুধু role: "admin" ব্যবহারকারীদের জন্য উন্মুক্ত। আপনার বর্তমান একাউন্ট রোল: <strong className="text-red-600">{profile?.role || 'user/guest'}</strong>
            </p>
          </div>

          {user ? (
            <div className="p-4 bg-[#FAF6EC] border border-[#F2A93B] rounded-xl text-left space-y-3">
              <p className="text-xs text-[#1B2A4A] font-bold">
                🛠️ ডেমো পরীক্ষার সুবিধার্থে এডমিন অ্যাক্সেস নিন:
              </p>
              <button
                onClick={makeAdmin}
                className="w-full bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold py-2.5 rounded-xl text-xs transition"
              >
                আমাকে এডমিন (admin) রোল দিন
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveView('login')}
              className="w-full bg-[#F2A93B] text-[#1B2A4A] font-bold py-3 rounded-xl text-sm"
            >
              প্রথমে লগইন করুন
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==================== HANDLERS ====================

  // 1. YEAR HANDLERS
  const handleSaveYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearName.trim()) return;
    setActionLoading(true);
    try {
      if (editingYearId) {
        await updateYear(editingYearId, yearName, Number(yearOrder));
        showToast('বর্ষ সফলতা সাথে আপডেট করা হয়েছে');
      } else {
        await addYear(yearName, Number(yearOrder));
        showToast('নতুন বর্ষ যুক্ত করা হয়েছে');
      }
      setYearName('');
      setYearOrder(years.length + 2);
      setEditingYearId(null);
    } catch (err: any) {
      showToast(err.message || 'ব্যর্থ হয়েছে', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditYear = (y: Year) => {
    setEditingYearId(y.id);
    setYearName(y.name);
    setYearOrder(y.order);
  };

  const handleDeleteYear = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই বর্ষটি মুছে ফেলতে চান?')) return;
    try {
      await deleteYear(id);
      showToast('বর্ষ মুছে ফেলা হয়েছে');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 2. DEPARTMENT HANDLERS
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) return;
    setActionLoading(true);
    try {
      if (editingDeptId) {
        await updateDepartment(editingDeptId, deptName, deptCode, Number(deptOrder));
        showToast('বিভাগ আপডেট করা হয়েছে');
      } else {
        await addDepartment(deptName, deptCode, Number(deptOrder));
        showToast('নতুন বিভাগ যুক্ত হয়েছে');
      }
      setDeptName('');
      setDeptCode('');
      setDeptOrder(departments.length + 2);
      setEditingDeptId(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditDept = (d: Department) => {
    setEditingDeptId(d.id);
    setDeptName(d.name);
    setDeptCode(d.code || '');
    setDeptOrder(d.order);
  };

  const handleDeleteDept = async (id: string) => {
    if (!window.confirm('বিভাগটি মুছে ফেলতে চান?')) return;
    try {
      await deleteDepartment(id);
      showToast('বিভাগ মুছে ফেলা হয়েছে');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 3. SUBJECT HANDLERS
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim() || !subYearId || !subDeptId) {
      showToast('বিষয়, বর্ষ ও বিভাগ সকল ঘর পূরণ করুন', 'error');
      return;
    }
    setActionLoading(true);
    try {
      if (editingSubjectId) {
        await updateSubject(editingSubjectId, subjectName, subYearId, subDeptId);
        showToast('বিষয় তথ্য আপডেট হয়েছে');
      } else {
        await addSubject(subjectName, subYearId, subDeptId);
        showToast('নতুন বিষয় যুক্ত করা হয়েছে');
      }
      setSubjectName('');
      setEditingSubjectId(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubject = (s: Subject) => {
    setEditingSubjectId(s.id);
    setSubjectName(s.name);
    setSubYearId(s.yearId);
    setSubDeptId(s.departmentId);
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('বিষয়টি মুছে ফেলতে চান?')) return;
    try {
      await deleteSubject(id);
      showToast('বিষয়টি মুছে ফেলা হয়েছে');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // 4. SUGGESTION HANDLERS
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setSuggImageUrls([...suggImageUrls, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleFileUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setSuggImageUrls(prev => [...prev, reader.result as string]);
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
        setSuggPdfUrl(reader.result as string);
        showToast('PDF ফাইল সফলভাবে আপলোড করা হয়েছে');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggSubjectId || !suggTitle.trim() || !suggContent.trim()) {
      showToast('বিষয়, বিষয়বস্তু ও শিরোনাম পূরণ করুন', 'error');
      return;
    }
    setActionLoading(true);
    try {
      if (editingSuggId) {
        await updateSuggestion(editingSuggId, {
          subjectId: suggSubjectId,
          title: suggTitle,
          content: suggContent,
          section: suggSection,
          imageUrls: suggImageUrls,
          pdfUrl: suggPdfUrl,
          contentType: suggContentType
        });
        showToast('সাজেশন/প্রশ্ন আপডেট করা হয়েছে');
      } else {
        await addSuggestion({
          subjectId: suggSubjectId,
          title: suggTitle,
          content: suggContent,
          section: suggSection,
          imageUrls: suggImageUrls,
          pdfUrl: suggPdfUrl,
          contentType: suggContentType
        });
        showToast(`নতুন ${suggContentType === 'question' ? 'প্রশ্ন' : 'সাজেশন'} যুক্ত হয়েছে`);
      }

      setSuggTitle('');
      setSuggContent('');
      setSuggSection('A');
      setSuggImageUrls([]);
      setSuggPdfUrl('');
      setSuggContentType('suggestion');
      setEditingSuggId(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSuggestion = (s: Suggestion) => {
    setEditingSuggId(s.id);
    setSuggSubjectId(s.subjectId);
    setSuggTitle(s.title);
    setSuggContent(s.content);
    setSuggSection(getSuggestionSection(s));
    setSuggImageUrls(s.imageUrls || []);
    setSuggPdfUrl(s.pdfUrl || '');
    setSuggContentType(s.contentType || 'suggestion');
  };

  const handleSelectQuestionFromPicker = (selectedQuestion: Suggestion, mode: 'load_all' | 'append_text' | 'quick_duplicate') => {
    if (mode === 'load_all') {
      if (selectedQuestion.subjectId) {
        setSuggSubjectId(selectedQuestion.subjectId);
      }
      setSuggTitle(selectedQuestion.title);
      setSuggContent(selectedQuestion.content);
      setSuggSection(getSuggestionSection(selectedQuestion));
      setSuggImageUrls(selectedQuestion.imageUrls || []);
      setSuggPdfUrl(selectedQuestion.pdfUrl || '');
      setSuggContentType('suggestion');
      showToast('প্রশ্নের তথ্য ফর্মে লোড হয়েছে! এবার প্রয়োজন অনুযায়ী পরিবর্তন করে সেভ করুন।');
    } else if (mode === 'append_text') {
      const separator = suggContent.trim() ? '\n\n---\n\n' : '';
      const textToAppend = `### ${selectedQuestion.title}\n\n${selectedQuestion.content}`;
      setSuggContent(prev => prev + separator + textToAppend);
      if (selectedQuestion.imageUrls && selectedQuestion.imageUrls.length > 0) {
        setSuggImageUrls(prev => [...prev, ...selectedQuestion.imageUrls!]);
      }
      showToast('প্রশ্নের টেক্সট ও উত্তর বর্তমান ফর্মে যুক্ত হয়েছে।');
    } else if (mode === 'quick_duplicate') {
      handleDuplicateQuestionToSuggestion(selectedQuestion);
    }
  };

  const handleDuplicateQuestionToSuggestion = async (sourceQuestion: Suggestion) => {
    setActionLoading(true);
    try {
      await addSuggestion({
        subjectId: sourceQuestion.subjectId,
        title: sourceQuestion.title,
        content: sourceQuestion.content,
        section: getSuggestionSection(sourceQuestion),
        imageUrls: sourceQuestion.imageUrls || [],
        pdfUrl: sourceQuestion.pdfUrl || '',
        contentType: 'suggestion'
      });
      showToast('প্রশ্ন থেকে সরাসরি একটি নতুন সাজেশনে যুক্ত করা হয়েছে!');
    } catch (err: any) {
      showToast('সাজেশনে কপি করতে ব্যর্থ: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    if (!window.confirm('সাজেশনটি মুছে ফেলতে চান?')) return;
    try {
      await deleteSuggestion(id);
      showToast('সাজেশন মুছে ফেলা হয়েছে');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSeedData = async () => {
    setActionLoading(true);
    const res = await seedInitialSampleData();
    showToast(res.message, res.success ? 'success' : 'error');
    setActionLoading(false);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2 animate-bounce ${
          toastMessage.type === 'success' ? 'bg-[#1B2A4A] text-[#F2A93B] border-[#F2A93B]' : 'bg-red-700 text-white border-red-500'
        }`}>
          <Check className="w-4 h-4 text-[#F2A93B]" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Admin Dashboard Header */}
      <div className="notebook-sheet p-6 sm:p-8 rounded-2xl border-2 border-[#E2D9C5] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F2A93B] text-[#1B2A4A] rounded-full text-xs font-extrabold font-heading mb-2">
              <ShieldAlert className="w-4 h-4" />
              এডমিন কন্টেন্ট ম্যানেজমেন্ট সিস্টেম (Admin CMS)
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B2A4A]">
              কন্টেন্ট কাস্টমাইজেশন ড্যাশবোর্ড
            </h2>
            <p className="text-xs text-slate-600 font-body">
              বর্ষ, বিভাগ, বিষয় ও সাজেশনের তথ্য যোগ, এডিট ও রিয়েল-টাইমে নিয়ন্ত্রণ করুন
            </p>
          </div>

          <button
            onClick={handleSeedData}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition"
          >
            <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
            নমুনা ডিগ্রি কন্টেন্ট সিড করুন
          </button>
        </div>

        {/* 4 Tabs Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#EADFC8]">
          <button
            onClick={() => setActiveTab('years')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-heading font-bold text-xs sm:text-sm transition ${
              activeTab === 'years'
                ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-sm'
                : 'bg-[#FAF6EC] text-slate-700 hover:bg-[#EAE2CE]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            ১. বর্ষ ম্যানেজমেন্ট ({years.length})
          </button>

          <button
            onClick={() => setActiveTab('departments')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-heading font-bold text-xs sm:text-sm transition ${
              activeTab === 'departments'
                ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-sm'
                : 'bg-[#FAF6EC] text-slate-700 hover:bg-[#EAE2CE]'
            }`}
          >
            <Layers className="w-4 h-4" />
            ২. বিভাগ ম্যানেজমেন্ট ({departments.length})
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-heading font-bold text-xs sm:text-sm transition ${
              activeTab === 'subjects'
                ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-sm'
                : 'bg-[#FAF6EC] text-slate-700 hover:bg-[#EAE2CE]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            ৩. বিষয় ম্যানেজমেন্ট ({subjects.length})
          </button>

          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-heading font-bold text-xs sm:text-sm transition ${
              activeTab === 'suggestions'
                ? 'bg-[#1B2A4A] text-[#F2A93B] shadow-sm'
                : 'bg-[#FAF6EC] text-slate-700 hover:bg-[#EAE2CE]'
            }`}
          >
            <FileText className="w-4 h-4" />
            ৪. সাজেশন ম্যানেজমেন্ট ({suggestions.length})
          </button>
        </div>
      </div>

      {/* ================= TAB 1: YEARS MANAGEMENT ================= */}
      {activeTab === 'years' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add / Edit Form */}
          <div className="notebook-sheet p-6 rounded-2xl border-2 border-[#E2D9C5] space-y-4 h-fit">
            <h3 className="font-heading font-bold text-lg text-[#1B2A4A] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#F2A93B]" />
              {editingYearId ? 'বর্ষ এডিট করুন' : 'নতুন বর্ষ যোগ করুন'}
            </h3>

            <form onSubmit={handleSaveYear} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  বর্ষের নাম (যেমন: ১ম বর্ষ):
                </label>
                <input
                  type="text"
                  required
                  placeholder="১ম বর্ষ (First Year)"
                  value={yearName}
                  onChange={(e) => setYearName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  ক্রম বা অর্ডারিং (Order Number):
                </label>
                <input
                  type="number"
                  required
                  value={yearOrder}
                  onChange={(e) => setYearOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {editingYearId ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
                {editingYearId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingYearId(null);
                      setYearName('');
                    }}
                    className="p-2.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Table */}
          <div className="md:col-span-2 notebook-sheet p-6 rounded-2xl border-2 border-[#E2D9C5] space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#1B2A4A]">
              বর্তমান বর্ষসমূহের তালিকা ({years.length}টি)
            </h3>

            {years.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                কোনো বর্ষ যুক্ত করা নেই। বাম পাশের ফর্ম থেকে নতুন বর্ষ যোগ করুন।
              </p>
            ) : (
              <div className="space-y-3">
                {years.map((y) => (
                  <div
                    key={y.id}
                    className="p-4 bg-[#FAF6EC] border border-[#D8CEB7] rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold bg-[#1B2A4A] text-amber-200 px-2 py-0.5 rounded-md mr-2">
                        Order #{y.order}
                      </span>
                      <strong className="font-heading font-bold text-sm text-[#1B2A4A]">{y.name}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditYear(y)}
                        className="p-2 bg-[#F2A93B]/20 hover:bg-[#F2A93B] text-[#1B2A4A] rounded-lg transition"
                        title="এডিট"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteYear(y.id)}
                        className="p-2 bg-red-100 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition"
                        title="ডিলিট"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: DEPARTMENTS MANAGEMENT ================= */}
      {activeTab === 'departments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add / Edit Form */}
          <div className="notebook-sheet p-6 rounded-2xl border-2 border-[#E2D9C5] space-y-4 h-fit">
            <h3 className="font-heading font-bold text-lg text-[#1B2A4A] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#F2A93B]" />
              {editingDeptId ? 'বিভাগ এডিট করুন' : 'নতুন বিভাগ যোগ করুন'}
            </h3>

            <form onSubmit={handleSaveDept} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  বিভাগের নাম (যেমন: BSS - বিএসএস):
                </label>
                <input
                  type="text"
                  required
                  placeholder="বিএসএস (BSS - Bachelor of Social Science)"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  বিভাগ কোড (Code):
                </label>
                <input
                  type="text"
                  placeholder="BSS"
                  value={deptCode}
                  onChange={(e) => setDeptCode(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  অর্ডারিং (Order):
                </label>
                <input
                  type="number"
                  required
                  value={deptOrder}
                  onChange={(e) => setDeptOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {editingDeptId ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
                {editingDeptId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDeptId(null);
                      setDeptName('');
                      setDeptCode('');
                    }}
                    className="p-2.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List Table */}
          <div className="md:col-span-2 notebook-sheet p-6 rounded-2xl border-2 border-[#E2D9C5] space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#1B2A4A]">
              বর্তমান বিভাগসমূহের তালিকা ({departments.length}টি)
            </h3>

            {departments.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                কোনো বিভাগ যুক্ত করা নেই।
              </p>
            ) : (
              <div className="space-y-3">
                {departments.map((d) => (
                  <div
                    key={d.id}
                    className="p-4 bg-[#FAF6EC] border border-[#D8CEB7] rounded-xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-[10px] font-bold bg-[#F2A93B] text-[#1B2A4A] px-2 py-0.5 rounded-md mr-2">
                        {d.code || 'DEPT'}
                      </span>
                      <strong className="font-heading font-bold text-sm text-[#1B2A4A]">{d.name}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditDept(d)}
                        className="p-2 bg-[#F2A93B]/20 hover:bg-[#F2A93B] text-[#1B2A4A] rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDept(d.id)}
                        className="p-2 bg-red-100 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: SUBJECTS MANAGEMENT ================= */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add / Edit Form */}
          <div className="notebook-sheet p-6 rounded-2xl border-2 border-[#E2D9C5] space-y-4 h-fit">
            <h3 className="font-heading font-bold text-lg text-[#1B2A4A] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#F2A93B]" />
              {editingSubjectId ? 'বিষয় এডিট করুন' : 'নতুন বিষয় যোগ করুন'}
            </h3>

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  বর্ষ বাছাই করুন:
                </label>
                <select
                  required
                  value={subYearId}
                  onChange={(e) => setSubYearId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                >
                  <option value="">-- বর্ষ পছন্দ করুন --</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  বিভাগ বাছাই করুন:
                </label>
                <select
                  required
                  value={subDeptId}
                  onChange={(e) => setSubDeptId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                >
                  <option value="">-- বিভাগ পছন্দ করুন --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  বিষয়টির নাম:
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: স্বাধীন বাংলাদেশের অভ্যুদয়ের ইতিহাস"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {editingSubjectId ? 'আপডেট করুন' : 'যোগ করুন'}
                </button>
                {editingSubjectId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSubjectId(null);
                      setSubjectName('');
                    }}
                    className="p-2.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Subjects Table */}
          <div className="md:col-span-2 notebook-sheet p-6 rounded-2xl border-2 border-[#E2D9C5] space-y-4">
            <h3 className="font-heading font-bold text-lg text-[#1B2A4A]">
              বিষয়ের তালিকা ({subjects.length}টি)
            </h3>

            {subjects.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                কোনো বিষয় এখনো যোগ করা হয়নি।
              </p>
            ) : (
              <div className="space-y-3">
                {subjects.map((s) => {
                  const yr = years.find((y) => y.id === s.yearId);
                  const dp = departments.find((d) => d.id === s.departmentId);

                  return (
                    <div
                      key={s.id}
                      className="p-4 bg-[#FAF6EC] border border-[#D8CEB7] rounded-xl flex items-center justify-between gap-3"
                    >
                      <div>
                        <strong className="font-heading font-bold text-sm text-[#1B2A4A] block">
                          {s.name}
                        </strong>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          বর্ষ: {yr?.name || 'N/A'} • বিভাগ: {dp?.name || 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleEditSubject(s)}
                          className="p-2 bg-[#F2A93B]/20 hover:bg-[#F2A93B] text-[#1B2A4A] rounded-lg transition"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSubject(s.id)}
                          className="p-2 bg-red-100 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 4: SUGGESTIONS MANAGEMENT ================= */}
      {activeTab === 'suggestions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form Column */}
          <div className="lg:col-span-6 notebook-sheet p-6 rounded-2xl border-2 border-[#E2D9C5] space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F2A93B]" />
                {editingSuggId ? 'কন্টেন্ট এডিট করুন' : `নতুন ${suggContentType === 'question' ? 'প্রশ্ন' : 'সাজেশন'} ও উত্তর যুক্ত করুন`}
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold font-heading flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="ক বিভাগের ৪০-১০০টি প্রশ্ন একসাথে পেস্ট করুন"
                >
                  <ListPlus className="w-3.5 h-3.5 text-emerald-300" />
                  ক বিভাগের বাল্ক পেস্ট
                </button>

                <button
                  type="button"
                  onClick={() => setIsQuestionPickerOpen(true)}
                  className="px-3 py-1.5 bg-[#FAF6EC] hover:bg-[#EAE2CE] text-[#1B2A4A] border border-[#D8CEB7] rounded-xl text-xs font-bold font-heading flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5 text-[#F2A93B]" />
                  প্রশ্ন থেকে আনুন
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveSuggestion} className="space-y-4">
              
              {/* Category Type */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  ক্যাটাগরি টাইপ:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSuggContentType('suggestion')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                      suggContentType === 'suggestion'
                        ? 'bg-[#1B2A4A] text-[#F2A93B] border-[#1B2A4A] shadow-xs'
                        : 'bg-[#FFFDF7] text-slate-700 border-[#D8CEB7]'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-[#F2A93B]" />
                    সাজেশন (Suggestion)
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuggContentType('question')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 cursor-pointer ${
                      suggContentType === 'question'
                        ? 'bg-[#1B2A4A] text-[#F2A93B] border-[#1B2A4A] shadow-xs'
                        : 'bg-[#FFFDF7] text-slate-700 border-[#D8CEB7]'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 text-[#F2A93B]" />
                    প্রশ্ন / বিগত সাল (Question)
                  </button>
                </div>
              </div>

              {/* Question Import Helper Banner */}
              <div className="p-3 bg-[#FAF6EC] border border-[#D8CEB7] rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F2A93B] shrink-0" />
                  <p className="text-[11px] text-slate-700 font-body">
                    আগের প্রশ্ন ব্যাংক থেকে প্রশ্ন ও উত্তর সরাসরি এখানে কপি করতে চান?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuestionPickerOpen(true)}
                  className="px-3 py-1 bg-[#1B2A4A] text-[#F2A93B] rounded-lg text-xs font-bold shrink-0 transition hover:bg-[#283e6b]"
                >
                  প্রশ্ন বাছাই করুন
                </button>
              </div>

              {/* Subject Dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  বিষয় নির্বাচন করুন:
                </label>
                <select
                  required
                  value={suggSubjectId}
                  onChange={(e) => setSuggSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none"
                >
                  <option value="">-- বিষয় নির্বাচন করুন --</option>
                  {subjects.map((s) => {
                    const yr = years.find((y) => y.id === s.yearId);
                    const dp = departments.find((d) => d.id === s.departmentId);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({yr?.name} - {dp?.code})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Section Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  বিভাগ নির্বাচন করুন:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSuggSection('A')}
                    className={`p-2 rounded-xl border text-center transition ${
                      suggSection === 'A'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                        : 'bg-[#FFFDF7] text-slate-700 border-[#D8CEB7] hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-heading font-extrabold text-xs block">ক বিভাগ</span>
                    <span className="text-[10px] opacity-80 font-body">অতিসংক্ষিপ্ত</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuggSection('B')}
                    className={`p-2 rounded-xl border text-center transition ${
                      suggSection === 'B'
                        ? 'bg-blue-700 text-white border-blue-800 shadow-2xs'
                        : 'bg-[#FFFDF7] text-slate-700 border-[#D8CEB7] hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-heading font-extrabold text-xs block">খ বিভাগ</span>
                    <span className="text-[10px] opacity-80 font-body">সংক্ষিপ্ত</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuggSection('C')}
                    className={`p-2 rounded-xl border text-center transition ${
                      suggSection === 'C'
                        ? 'bg-purple-700 text-white border-purple-800 shadow-2xs'
                        : 'bg-[#FFFDF7] text-slate-700 border-[#D8CEB7] hover:bg-slate-50'
                    }`}
                  >
                    <span className="font-heading font-extrabold text-xs block">গ বিভাগ</span>
                    <span className="text-[10px] opacity-80 font-body">রচনামূলক</span>
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  {suggContentType === 'question' ? 'প্রশ্নের শিরোনাম / সাল:' : 'সাজেশনের শিরোনাম (যেমন: ক-বিভাগ সংক্ষিপ্ত প্রশ্ন):'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={suggContentType === 'question' ? "যেমন: ২০২০ সালের বিগত বছরের প্রশ্ন" : "যেমন: খ-বিভাগ: ১৯৬৬ সালের ৬-দফা দাবির তাৎপর্য আলোচনা কর।"}
                  value={suggTitle}
                  onChange={(e) => setSuggTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none font-heading font-bold"
                />
              </div>

              {/* Detailed Content */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading">
                  বিস্তারিত লেখা ও উত্তর (Full Content Text):
                </label>

                <LinkInsertToolbar
                  textareaRef={suggContentRef}
                  value={suggContent}
                  onChange={setSuggContent}
                />

                <textarea
                  ref={suggContentRef}
                  required
                  rows={8}
                  placeholder="এখানে পুরো প্রশ্ন, সংক্ষিপ্ত উত্তর বা পয়েন্ট আকারে বিস্তারিত লিখুন..."
                  value={suggContent}
                  onChange={(e) => setSuggContent(e.target.value)}
                  className="w-full px-3 py-2.5 bg-[#FFFDF7] border border-[#D8CEB7] focus:border-[#F2A93B] rounded-xl text-xs text-[#1B2A4A] outline-none font-body leading-relaxed"
                />
              </div>

              {/* Images Management */}
              <div className="p-4 bg-[#FAF6EC] border border-[#D8CEB7] rounded-xl space-y-3">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading flex items-center justify-between">
                  <span>হ্যান্ডনোটসের ছবি যুক্ত করুন (ঐচ্ছিক / Optional)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({suggImageUrls.length}টি যুক্ত)
                  </span>
                </label>

                {/* Upload Image File */}
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-[#FFFDF7] hover:bg-amber-50 border border-dashed border-[#F2A93B] px-3 py-2 rounded-xl text-xs font-bold text-[#1B2A4A] text-center transition flex items-center justify-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#F2A93B]" />
                    ছবি ডিভাইস থেকে আপলোড করুন (ঐচ্ছিক)
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUploadImage}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Or paste Image URL */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="অথবা ইমেজের লিঙ্ক/URL লিখুন (ঐচ্ছিক)..."
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#FFFDF7] border border-[#D8CEB7] rounded-lg text-xs text-[#1B2A4A] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-1.5 bg-[#1B2A4A] text-[#F2A93B] rounded-lg text-xs font-bold"
                  >
                    যুক্ত
                  </button>
                </div>

                {/* Image Previews */}
                {suggImageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {suggImageUrls.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-lg border border-[#D8CEB7] overflow-hidden bg-white">
                        <img src={url} alt="Note page" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setSuggImageUrls(suggImageUrls.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PDF Management */}
              <div className="p-4 bg-[#FAF6EC] border border-[#D8CEB7] rounded-xl space-y-3">
                <label className="text-xs font-bold text-[#1B2A4A] font-heading flex items-center justify-between">
                  <span>PDF ফাইল যুক্ত করুন (ঐচ্ছিক / Optional)</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    (অফলাইন রিড লিংক)
                  </span>
                </label>

                <label className="block cursor-pointer bg-[#FFFDF7] hover:bg-amber-50 border border-dashed border-[#F2A93B] px-3 py-2 rounded-xl text-xs font-bold text-[#1B2A4A] text-center transition">
                  <FileDown className="w-4 h-4 text-[#F2A93B] inline mr-1" />
                  ডিভাইস থেকে PDF ফাইল পছন্দ করুন (ঐচ্ছিক)
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileUploadPdf}
                    className="hidden"
                  />
                </label>

                <input
                  type="url"
                  placeholder="অথবা PDF ডাউনলোড URL বসান (ঐচ্ছিক - https://...)"
                  value={suggPdfUrl}
                  onChange={(e) => setSuggPdfUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF7] border border-[#D8CEB7] rounded-xl text-xs text-[#1B2A4A] outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  {editingSuggId ? 'তথ্য আপডেট করুন' : `নতুন ${suggContentType === 'question' ? 'প্রশ্ন' : 'সাজেশন'} সেভ করুন`}
                </button>
                {editingSuggId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSuggId(null);
                      setSuggTitle('');
                      setSuggContent('');
                      setSuggImageUrls([]);
                      setSuggPdfUrl('');
                      setSuggContentType('suggestion');
                    }}
                    className="p-3 bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    বাতিল
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Existing Suggestions List Column */}
          <div className="lg:col-span-6 notebook-sheet p-6 rounded-2xl border-2 border-[#E2D9C5] space-y-4 max-h-[850px] overflow-y-auto">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-heading font-bold text-lg text-[#1B2A4A]">
                সকল কনটেন্ট ({suggestions.length}টি)
              </h3>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-[#FAF6EC] p-1 rounded-xl border border-[#D8CEB7]">
                <button
                  type="button"
                  onClick={() => setAdminSuggFilterTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    adminSuggFilterTab === 'all' ? 'bg-[#1B2A4A] text-[#F2A93B]' : 'text-slate-600'
                  }`}
                >
                  সব ({suggestions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSuggFilterTab('suggestion')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    adminSuggFilterTab === 'suggestion' ? 'bg-[#1B2A4A] text-[#F2A93B]' : 'text-slate-600'
                  }`}
                >
                  সাজেশন ({suggestions.filter(s => s.contentType !== 'question').length})
                </button>
                <button
                  type="button"
                  onClick={() => setAdminSuggFilterTab('question')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    adminSuggFilterTab === 'question' ? 'bg-[#1B2A4A] text-[#F2A93B]' : 'text-slate-600'
                  }`}
                >
                  প্রশ্ন ({suggestions.filter(s => s.contentType === 'question').length})
                </button>
              </div>
            </div>

            {suggestions.filter(s => {
              if (adminSuggFilterTab === 'suggestion') return s.contentType !== 'question';
              if (adminSuggFilterTab === 'question') return s.contentType === 'question';
              return true;
            }).length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                কোনো তথ্য পাওয়া যায়নি। বাম পাশের ফর্ম পূরণ করে যোগ করুন।
              </p>
            ) : (
              <div className="space-y-3">
                {suggestions
                  .filter(s => {
                    if (adminSuggFilterTab === 'suggestion') return s.contentType !== 'question';
                    if (adminSuggFilterTab === 'question') return s.contentType === 'question';
                    return true;
                  })
                  .map((s) => {
                    const subj = subjects.find((sb) => sb.id === s.subjectId);
                    const isQuestion = s.contentType === 'question';
                    const sec = getSuggestionSection(s);
                    const secMeta = SECTIONS_META[sec];

                    return (
                      <div
                        key={s.id}
                        className="p-4 bg-[#FAF6EC] border border-[#D8CEB7] rounded-xl space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${secMeta.badgeBg} ${secMeta.badgeText}`}>
                                {secMeta.name}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isQuestion ? 'bg-amber-100 text-[#1B2A4A] border border-[#F2A93B]/60' : 'bg-[#1B2A4A] text-[#F2A93B]'
                              }`}>
                                {isQuestion ? 'প্রশ্ন' : 'সাজেশন'}
                              </span>
                              <p className="text-[11px] text-slate-500 font-medium">
                                বিষয়: {subj?.name || 'অজানা বিষয়'}
                              </p>
                            </div>
                            <strong className="font-heading font-bold text-sm text-[#1B2A4A] block">
                              {s.title}
                            </strong>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isQuestion && (
                              <button
                                onClick={() => handleDuplicateQuestionToSuggestion(s)}
                                className="p-2 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#F2A93B] rounded-lg transition"
                                title="এই প্রশ্নটি সাজেশনে রূপান্তর/কপি করুন"
                              >
                                <Sparkles className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditSuggestion(s)}
                              className="p-2 bg-[#F2A93B]/20 hover:bg-[#F2A93B] text-[#1B2A4A] rounded-lg transition"
                              title="এডিট"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSuggestion(s.id)}
                              className="p-2 bg-red-100 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition"
                              title="ডিলিট"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 line-clamp-3 font-body bg-[#FFFDF7] p-2 rounded-md border border-[#EADFC8]">
                          <FormattedContent content={s.content} />
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold pt-1">
                          <span>📷 ছবি: {s.imageUrls?.length || 0}টি</span>
                          <span>📄 PDF: {s.pdfUrl ? 'আছে' : 'নেই'}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Question Picker Modal */}
      <QuestionPickerModal
        isOpen={isQuestionPickerOpen}
        onClose={() => setIsQuestionPickerOpen(false)}
        currentSubjectId={suggSubjectId}
        allSuggestions={suggestions}
        subjects={subjects}
        onSelectQuestion={handleSelectQuestionFromPicker}
      />

      {/* Bulk Section A Import Modal */}
      {subjects.length > 0 && (
        <BulkSectionAImportModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          selectedSubject={subjects.find(s => s.id === suggSubjectId) || subjects[0]}
          initialSection={suggSection}
          onSuccess={(count) => {
            showToast(`সফলভাবে ${count}টি প্রশ্ন ক বিভাগে যুক্ত করা হয়েছে!`, 'success');
          }}
        />
      )}

    </div>
  );
};
