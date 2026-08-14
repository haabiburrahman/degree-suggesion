import React, { useState } from 'react';
import { Calendar, ChevronRight, BookOpen, Search, Sparkles, GraduationCap, Award, RefreshCw } from 'lucide-react';
import { Year, Subject, Suggestion, Department, ActiveView } from '../types';
import { seedInitialSampleData } from '../services/db';
import { FormattedContent } from '../components/FormattedContent';

interface HomePageProps {
  years: Year[];
  allSubjects: Subject[];
  allSuggestions: Suggestion[];
  allDepartments: Department[];
  onSelectYear: (year: Year) => void;
  onSelectSubjectDirectly: (year: Year, dept: Department, subj: Subject) => void;
  onSelectSuggestionDirectly: (year: Year, dept: Department, subj: Subject, sugg: Suggestion) => void;
  setActiveView: (view: ActiveView) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  years,
  allSubjects,
  allSuggestions,
  allDepartments,
  onSelectYear,
  onSelectSubjectDirectly,
  onSelectSuggestionDirectly,
  setActiveView
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  const handleSeedData = async () => {
    setSeeding(true);
    setSeedMessage('তথ্য লোড হচ্ছে...');
    const result = await seedInitialSampleData();
    setSeedMessage(result.message);
    setSeeding(false);
  };

  // Filter subjects / suggestions if user types in search
  const filteredSuggestions = searchQuery.trim() ? allSuggestions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const filteredSubjects = searchQuery.trim() ? allSubjects.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hero Welcome Banner - Styled as Exam Paper / Notebook Banner */}
      <div className="notebook-sheet p-6 sm:p-8 rounded-2xl relative overflow-hidden border-2 border-[#E2D9C5] shadow-md">
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-[#F2A93B]/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F2A93B]/20 text-[#1B2A4A] border border-[#F2A93B]/50 rounded-full text-xs font-bold font-heading">
            <GraduationCap className="w-4 h-4 text-[#1B2A4A]" />
            জাতীয় বিশ্ববিদ্যালয় ডিগ্রি পাস ও সার্টিফিকেট কোর্স
          </div>

          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-[#1B2A4A] leading-tight">
            বিষয়ভিত্তিক পরীক্ষার <span className="underline decoration-[#F2A93B] decoration-4 underline-offset-4">সাজেশন ও উত্তর</span>
          </h2>

          <p className="font-body text-slate-700 text-sm sm:text-base leading-relaxed">
            ১ম, ২য় ও ৩য় বর্ষের পরীক্ষা পাসের প্রস্তুতি সহজ করতে বিষয়ভিত্তিক ১০০% নির্ভুল সাজেশন, লিখিত উত্তর, প্রশ্নব্যাংক, নোটসের ছবি ও PDF ডাউনলোড সুবিধা।
          </p>

          {/* Quick Search Bar */}
          <div className="pt-2">
            <div className="relative max-w-xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="যেকোনো বিষয় বা প্রশ্ন খুঁজুন (যেমন: ইতিহাস, ৬-দফা, রাষ্ট্রবিজ্ঞান)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-[#FFFDF7] border-2 border-[#D8CEB7] focus:border-[#F2A93B] focus:ring-2 focus:ring-[#F2A93B]/20 rounded-xl text-sm font-body text-[#1B2A4A] shadow-inner placeholder:text-slate-400 outline-none transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Results if searchQuery exists */}
      {searchQuery.trim() !== '' && (
        <div className="notebook-sheet p-6 rounded-2xl space-y-4 border border-[#E2D9C5]">
          <h3 className="font-heading font-bold text-lg text-[#1B2A4A] flex items-center gap-2">
            <Search className="w-5 h-5 text-[#F2A93B]" />
            খোঁজার ফলাফল ({filteredSuggestions.length + filteredSubjects.length}টি পাওয়া গেছে)
          </h3>

          {filteredSuggestions.length === 0 && filteredSubjects.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              "{searchQuery}" সম্পর্কিত কোনো বিষয় বা সাজেশন খুঁজে পাওয়া যায়নি।
            </p>
          ) : (
            <div className="space-y-3">
              {filteredSubjects.map((subj) => {
                const year = years.find(y => y.id === subj.yearId);
                const dept = allDepartments.find(d => d.id === subj.departmentId);
                return (
                  <div
                    key={subj.id}
                    onClick={() => {
                      if (year && dept) onSelectSubjectDirectly(year, dept, subj);
                    }}
                    className="p-3 bg-[#FAF6EC] hover:bg-[#F2A93B]/20 border border-[#D8CEB7] rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold bg-[#1B2A4A] text-amber-200 px-2 py-0.5 rounded-full mr-2">
                        বিষয়
                      </span>
                      <strong className="font-heading font-bold text-[#1B2A4A] text-sm">{subj.name}</strong>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {year?.name} • {dept?.name}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#1B2A4A]" />
                  </div>
                );
              })}

              {filteredSuggestions.map((sugg) => {
                const subj = allSubjects.find(s => s.id === sugg.subjectId);
                const year = subj ? years.find(y => y.id === subj.yearId) : null;
                const dept = subj ? allDepartments.find(d => d.id === subj.departmentId) : null;
                return (
                  <div
                    key={sugg.id}
                    onClick={() => {
                      if (year && dept && subj) onSelectSuggestionDirectly(year, dept, subj, sugg);
                    }}
                    className="p-3.5 bg-[#FFFDF7] hover:bg-[#F2A93B]/20 border border-[#D8CEB7] rounded-xl cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-bold bg-[#F2A93B] text-[#1B2A4A] px-2 py-0.5 rounded-full mr-2">
                        সাজেশন
                      </span>
                      <strong className="font-heading font-bold text-[#1B2A4A] text-sm">{sugg.title}</strong>
                      <div className="text-xs text-slate-600 line-clamp-2 mt-1 font-body">
                        <FormattedContent content={sugg.content} />
                      </div>
                      {subj && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          বিষয়: {subj.name} ({year?.name})
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#1B2A4A] shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Section: Year Selection Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-extrabold text-xl sm:text-2xl text-[#1B2A4A] flex items-center gap-2">
              <Calendar className="w-6 h-6 text-[#F2A93B]" />
              আপনার পরীক্ষার বর্ষ নির্বাচন করুন
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 font-body">
              নিচের বর্ষ কার্ডে ক্লিক করে কাঙ্ক্ষিত বিভাগের বিষয়সূচি দেখুন
            </p>
          </div>

          {years.length === 0 && (
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="flex items-center gap-2 bg-[#F2A93B] hover:bg-[#e0982a] text-[#1B2A4A] font-bold px-3 py-2 rounded-xl text-xs shadow-md transition"
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
              নমুনা ডাটা লোড করুন
            </button>
          )}
        </div>

        {seedMessage && (
          <div className="p-3 bg-[#F2A93B]/20 border border-[#F2A93B] text-[#1B2A4A] rounded-xl text-xs font-bold text-center">
            {seedMessage}
          </div>
        )}

        {/* Empty State / Seed Suggestion */}
        {years.length === 0 ? (
          <div className="notebook-sheet p-8 text-center rounded-2xl border-2 border-dashed border-[#D8CEB7] space-y-4">
            <div className="w-16 h-16 bg-[#F2A93B]/20 text-[#1B2A4A] rounded-full flex items-center justify-center mx-auto border border-[#F2A93B]">
              <BookOpen className="w-8 h-8 text-[#1B2A4A]" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-lg text-[#1B2A4A]">
                ডাটাবেজ বর্তমানে খালি রয়েছে!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                এডমিন ড্যাশবোর্ড থেকে তথ্য যোগ করতে পারেন, অথবা ১-ক্লিকে নমুনা ডিগ্রি সাজেশন ডাটা সিড করতে পারেন।
              </p>
            </div>
            <button
              onClick={handleSeedData}
              disabled={seeding}
              className="inline-flex items-center gap-2 bg-[#1B2A4A] hover:bg-[#283e6b] text-[#FAF6EC] font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition"
            >
              <Sparkles className="w-4 h-4 text-[#F2A93B]" />
              ১-ক্লিকে নমুনা পরীক্ষা ডাটা যুক্ত করুন
            </button>
          </div>
        ) : (
          /* Year Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {years.map((year, index) => {
              const yearSubjects = allSubjects.filter(s => s.yearId === year.id);

              return (
                <div
                  key={year.id}
                  onClick={() => onSelectYear(year)}
                  className="notebook-sheet group relative p-6 rounded-2xl cursor-pointer border-2 border-[#E2D9C5] hover:border-[#F2A93B] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
                >
                  {/* Notebook Red Margin Line Decoration */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-red-400/40" />

                  <div className="pl-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="w-9 h-9 rounded-xl bg-[#1B2A4A] text-[#F2A93B] font-heading font-bold text-sm flex items-center justify-center shadow-inner">
                        0{index + 1}
                      </span>
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-[#F2A93B]/20 text-[#1B2A4A] border border-[#F2A93B]/40 rounded-full">
                        ডিগ্রি পরীক্ষা
                      </span>
                    </div>

                    <div>
                      <h4 className="font-heading text-xl font-extrabold text-[#1B2A4A] group-hover:text-[#1B2A4A]">
                        {year.name}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 font-body">
                        বিএসএস, বিএসসি ও বিবিএ বর্ষভিত্তিক সকল কোর্স বিষয়াবলি
                      </p>
                    </div>
                  </div>

                  <div className="pl-6 pt-6 mt-4 border-t border-[#EADFC8] flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-[#F2A93B]" />
                      {yearSubjects.length}টি বিষয় অন্তর্ভুক্ত
                    </span>
                    <span className="inline-flex items-center gap-1 font-heading font-bold text-[#1B2A4A] group-hover:translate-x-1 transition-transform">
                      বিভাগ দেখুন
                      <ChevronRight className="w-4 h-4 text-[#F2A93B]" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Feature Highlights Section - Notebook Paper Theme */}
      <div className="notebook-sheet p-6 sm:p-8 rounded-2xl border border-[#E2D9C5] space-y-6">
        <h3 className="font-heading font-bold text-xl text-[#1B2A4A] text-center">
          ডিগ্রি সাজেশন প্ল্যাটফর্মের সুবিধা সমূহ
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-[#FAF6EC] rounded-xl border border-[#D8CEB7] space-y-2">
            <div className="w-10 h-10 bg-[#1B2A4A] text-[#F2A93B] rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-[#1B2A4A] text-base">১০০% ফ্রি সাজেশন</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-body">
              পরীক্ষার বিষয়ভিত্তিক লিখিত সাজেশন ও ক, খ, গ বিভাগের উত্তরসমূহ বিনামূল্যে যেকোনো সময় উন্মুক্তভাবে রিড করুন।
            </p>
          </div>

          <div className="p-4 bg-[#FAF6EC] rounded-xl border border-[#D8CEB7] space-y-2">
            <div className="w-10 h-10 bg-[#1B2A4A] text-[#F2A93B] rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-[#1B2A4A] text-base">ছবি ও হ্যান্ডনোটস</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-body">
              ইমেইল দিয়ে লগইন করেই হ্যান্ডরাইটিং নোটস ও উত্তরের ছবি স্পষ্ট জুম করে সহজেই দেখতে পারবেন।
            </p>
          </div>

          <div className="p-4 bg-[#FAF6EC] rounded-xl border border-[#D8CEB7] space-y-2">
            <div className="w-10 h-10 bg-[#1B2A4A] text-[#F2A93B] rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-[#1B2A4A] text-base">PDF ডাউনলোড</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-body">
              পরীক্ষার হল প্রস্তুতির জন্য গুরুত্বপূর্ণ সাজেশনের অফলাইন PDF ফাইল সরাসরি ডাউনলোড করে সংরক্ষণ করতে পারবেন।
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
