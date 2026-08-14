import React from 'react';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { Year, Department, Subject, ActiveView } from '../types';

interface BreadcrumbsProps {
  selectedYear: Year | null;
  selectedDept: Department | null;
  selectedSubject: Subject | null;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  setSelectedSubject: (subj: Subject | null) => void;
  setSelectedDept: (dept: Department | null) => void;
  setSelectedYear: (year: Year | null) => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  selectedYear,
  selectedDept,
  selectedSubject,
  activeView,
  setActiveView,
  setSelectedSubject,
  setSelectedDept,
  setSelectedYear
}) => {
  if (activeView === 'home' || activeView === 'login' || activeView === 'admin') {
    return null;
  }

  const handleBack = () => {
    if (activeView === 'suggestion-detail') {
      setActiveView('suggestions');
    } else if (activeView === 'suggestions') {
      setActiveView('subjects');
      setSelectedSubject(null);
    } else if (activeView === 'subjects') {
      setActiveView('departments');
      setSelectedDept(null);
    } else if (activeView === 'departments') {
      setActiveView('home');
      setSelectedYear(null);
    }
  };

  return (
    <div className="bg-[#FFFDF7] border-b border-[#E2D9C5] py-2.5 px-4 shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs sm:text-sm font-body">
        
        {/* Breadcrumb Path */}
        <div className="flex items-center flex-wrap gap-1 sm:gap-2 text-slate-700 font-medium">
          <button
            onClick={() => {
              setSelectedYear(null);
              setSelectedDept(null);
              setSelectedSubject(null);
              setActiveView('home');
            }}
            className="flex items-center gap-1 text-[#1B2A4A] hover:text-[#F2A93B] font-bold transition"
          >
            <Home className="w-3.5 h-3.5 text-[#1B2A4A]" />
            <span>হোম</span>
          </button>

          {selectedYear && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={() => {
                  setSelectedDept(null);
                  setSelectedSubject(null);
                  setActiveView('departments');
                }}
                className={`truncate max-w-[120px] sm:max-w-none ${
                  activeView === 'departments' 
                    ? 'font-bold text-[#1B2A4A] bg-[#F2A93B]/20 px-2 py-0.5 rounded-md border border-[#F2A93B]/40' 
                    : 'text-slate-600 hover:text-[#1B2A4A]'
                }`}
              >
                {selectedYear.name}
              </button>
            </>
          )}

          {selectedDept && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={() => {
                  setSelectedSubject(null);
                  setActiveView('subjects');
                }}
                className={`truncate max-w-[120px] sm:max-w-none ${
                  activeView === 'subjects' 
                    ? 'font-bold text-[#1B2A4A] bg-[#F2A93B]/20 px-2 py-0.5 rounded-md border border-[#F2A93B]/40' 
                    : 'text-slate-600 hover:text-[#1B2A4A]'
                }`}
              >
                {selectedDept.name}
              </button>
            </>
          )}

          {selectedSubject && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <button
                onClick={() => {
                  setActiveView('suggestions');
                }}
                className={`truncate max-w-[140px] sm:max-w-none ${
                  activeView === 'suggestions' 
                    ? 'font-bold text-[#1B2A4A] bg-[#F2A93B]/20 px-2 py-0.5 rounded-md border border-[#F2A93B]/40' 
                    : 'text-slate-600 hover:text-[#1B2A4A]'
                }`}
              >
                {selectedSubject.name}
              </button>
            </>
          )}

          {activeView === 'suggestion-detail' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-bold text-[#1B2A4A] bg-[#F2A93B]/30 px-2 py-0.5 rounded-md">
                সাজেশন ও উত্তর
              </span>
            </>
          )}
        </div>

        {/* Back Button for Quick Mobile Nav */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-[#1B2A4A] bg-[#FAF6EC] hover:bg-[#EAE2CE] border border-[#D8CEB7] px-2.5 py-1 rounded-lg font-bold text-xs shadow-2xs transition shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>পেছনে যান</span>
        </button>

      </div>
    </div>
  );
};
