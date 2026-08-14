import React from 'react';
import { BookOpen, ChevronRight, FileText, BookmarkCheck } from 'lucide-react';
import { Year, Department, Subject, Suggestion } from '../types';

interface SubjectPageProps {
  selectedYear: Year;
  selectedDept: Department;
  subjects: Subject[];
  allSuggestions: Suggestion[];
  onSelectSubject: (subj: Subject) => void;
}

export const SubjectPage: React.FC<SubjectPageProps> = ({
  selectedYear,
  selectedDept,
  subjects,
  allSuggestions,
  onSelectSubject,
}) => {
  // Filter subjects for current year and department
  const filteredSubjects = subjects.filter(
    (s) => s.yearId === selectedYear.id && s.departmentId === selectedDept.id
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="notebook-sheet p-6 sm:p-8 rounded-2xl border-2 border-[#E2D9C5] space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-0.5 bg-[#1B2A4A] text-amber-200 rounded-full text-xs font-bold font-heading">
            {selectedYear.name}
          </span>
          <span className="px-3 py-0.5 bg-[#F2A93B] text-[#1B2A4A] rounded-full text-xs font-bold font-heading">
            {selectedDept.name}
          </span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B2A4A]">
          বিষয়সমূহের তালিকা (Subjects List)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-body">
          পরীক্ষার সাজেশনের জন্য আপনার নির্দিষ্ট বিষয়টি নির্বাচন করুন
        </p>
      </div>

      {filteredSubjects.length === 0 ? (
        <div className="notebook-sheet p-8 text-center rounded-2xl border border-[#E2D9C5] text-slate-600 space-y-3">
          <p className="text-sm">
            এই বিভাগ ও বর্ষে এখনো কোনো বিষয় যুক্ত করা হয়নি।
          </p>
          <p className="text-xs text-slate-400">
            এডমিন ড্যাশবোর্ড থেকে নতুন বিষয় যুক্ত করা সম্ভব।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSubjects.map((subject, idx) => {
            const subjectSuggestions = allSuggestions.filter((s) => s.subjectId === subject.id);

            return (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(subject)}
                className="notebook-sheet group relative p-5 rounded-2xl cursor-pointer border-2 border-[#E2D9C5] hover:border-[#F2A93B] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 space-y-4 flex flex-col justify-between"
              >
                {/* Red margin line */}
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-red-400/40" />

                <div className="pl-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-lg bg-[#FAF6EC] border border-[#D8CEB7] text-[#1B2A4A] font-heading font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-bold text-[#1B2A4A] bg-[#F2A93B]/20 border border-[#F2A93B]/40 px-2.5 py-0.5 rounded-full">
                      {subjectSuggestions.length}টি সাজেশন
                    </span>
                  </div>

                  <h3 className="font-heading text-lg font-extrabold text-[#1B2A4A] leading-snug">
                    {subject.name}
                  </h3>
                </div>

                <div className="pl-5 pt-3 border-t border-[#EADFC8] flex items-center justify-between text-xs font-bold text-[#1B2A4A]">
                  <span className="text-slate-500 flex items-center gap-1 font-body">
                    <BookmarkCheck className="w-4 h-4 text-[#F2A93B]" />
                    কোর্সের সম্পূর্ণ উত্তরসহ
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#1B2A4A] group-hover:translate-x-1 transition-transform">
                    সাজেশন দেখুন
                    <ChevronRight className="w-4 h-4 text-[#F2A93B]" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
