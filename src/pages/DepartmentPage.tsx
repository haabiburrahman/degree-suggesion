import React from 'react';
import { Layers, ChevronRight, BookOpen, Building2 } from 'lucide-react';
import { Year, Department, Subject } from '../types';

interface DepartmentPageProps {
  selectedYear: Year;
  departments: Department[];
  subjects: Subject[];
  onSelectDepartment: (dept: Department) => void;
}

export const DepartmentPage: React.FC<DepartmentPageProps> = ({
  selectedYear,
  departments,
  subjects,
  onSelectDepartment,
}) => {
  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Banner */}
      <div className="notebook-sheet p-6 sm:p-8 rounded-2xl border-2 border-[#E2D9C5] space-y-2">
        <span className="inline-block px-3 py-1 bg-[#F2A93B]/20 text-[#1B2A4A] border border-[#F2A93B]/40 rounded-full text-xs font-bold font-heading">
          {selectedYear.name}
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#1B2A4A]">
          বিভাগ নির্বাচন করুন (Select Department)
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-body">
          {selectedYear.name}-এর অন্তর্ভুক্ত আপনার ডিগ্রি বিভাগটি নির্বাচন করুন
        </p>
      </div>

      {departments.length === 0 ? (
        <div className="notebook-sheet p-8 text-center rounded-2xl border border-[#E2D9C5] text-slate-500">
          কোনো বিভাগ যুক্ত করা হয়নি। এডমিন ড্যাশবোর্ড থেকে বিভাগ যোগ করুন।
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {departments.map((dept) => {
            const deptSubjects = subjects.filter(
              (s) => s.yearId === selectedYear.id && s.departmentId === dept.id
            );

            return (
              <div
                key={dept.id}
                onClick={() => onSelectDepartment(dept)}
                className="notebook-sheet group relative p-6 rounded-2xl cursor-pointer border-2 border-[#E2D9C5] hover:border-[#F2A93B] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 space-y-4 flex flex-col justify-between"
              >
                {/* Red notebook margin decoration */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-red-400/40" />

                <div className="pl-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="p-2.5 bg-[#1B2A4A] text-[#F2A93B] rounded-xl font-bold text-xs uppercase tracking-wider shadow-inner">
                      {dept.code || 'DEPT'}
                    </span>
                    <span className="text-[11px] font-bold text-[#1B2A4A] bg-[#F2A93B]/20 px-2.5 py-1 rounded-full border border-[#F2A93B]/40">
                      {deptSubjects.length}টি বিষয়
                    </span>
                  </div>

                  <div>
                    <h3 className="font-heading text-xl font-extrabold text-[#1B2A4A]">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 font-body">
                      ডিগ্রি পাস ও সার্টিফিকেট কোর্স পরীক্ষার্থীদের নির্ধারিত আবশ্যিক ও ঐচ্ছিক বিষয়াবলি
                    </p>
                  </div>
                </div>

                <div className="pl-6 pt-4 border-t border-[#EADFC8] flex items-center justify-between text-xs font-bold text-[#1B2A4A]">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <Building2 className="w-4 h-4 text-[#F2A93B]" />
                    কোর্স কোড: {dept.code}
                  </span>
                  <span className="inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    বিষয় তালিকা
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
