/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { PwaInstallBanner } from './components/PwaInstallBanner';

import { HomePage } from './pages/HomePage';
import { DepartmentPage } from './pages/DepartmentPage';
import { SubjectPage } from './pages/SubjectPage';
import { SuggestionListPage } from './pages/SuggestionListPage';
import { SuggestionDetailPage } from './pages/SuggestionDetailPage';
import { AuthPage } from './pages/AuthPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

import { Year, Department, Subject, Suggestion, ActiveView } from './types';
import { 
  subscribeYears, 
  subscribeDepartments, 
  subscribeAllSubjects, 
  subscribeAllSuggestions 
} from './services/db';

function MainApp() {
  const [activeView, setActiveView] = useState<ActiveView>('home');

  const [selectedYear, setSelectedYear] = useState<Year | null>(null);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  // Firestore real-time data states
  const [years, setYears] = useState<Year[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // Register PWA Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.log('PWA ServiceWorker registration failed:', err);
        });
      });
    }
  }, []);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    const unsubYears = subscribeYears((data) => setYears(data));
    const unsubDepts = subscribeDepartments((data) => setDepartments(data));
    const unsubSubjs = subscribeAllSubjects((data) => setSubjects(data));
    const unsubSuggs = subscribeAllSuggestions((data) => setSuggestions(data));

    return () => {
      if (unsubYears) unsubYears();
      if (unsubDepts) unsubDepts();
      if (unsubSubjs) unsubSubjs();
      if (unsubSuggs) unsubSuggs();
    };
  }, []);

  const resetNavigation = () => {
    setSelectedYear(null);
    setSelectedDept(null);
    setSelectedSubject(null);
    setSelectedSuggestion(null);
    setActiveView('home');
  };

  const handleSelectYear = (year: Year) => {
    setSelectedYear(year);
    setSelectedDept(null);
    setSelectedSubject(null);
    setSelectedSuggestion(null);
    setActiveView('departments');
  };

  const handleSelectDept = (dept: Department) => {
    setSelectedDept(dept);
    setSelectedSubject(null);
    setSelectedSuggestion(null);
    setActiveView('subjects');
  };

  const handleSelectSubject = (subj: Subject) => {
    setSelectedSubject(subj);
    setSelectedSuggestion(null);
    setActiveView('suggestions');
  };

  const handleSelectSuggestion = (sugg: Suggestion) => {
    setSelectedSuggestion(sugg);
    setActiveView('suggestion-detail');
  };

  // Direct Selection Handlers (used by search on Home Page)
  const handleSelectSubjectDirectly = (year: Year, dept: Department, subj: Subject) => {
    setSelectedYear(year);
    setSelectedDept(dept);
    setSelectedSubject(subj);
    setSelectedSuggestion(null);
    setActiveView('suggestions');
  };

  const handleSelectSuggestionDirectly = (year: Year, dept: Department, subj: Subject, sugg: Suggestion) => {
    setSelectedYear(year);
    setSelectedDept(dept);
    setSelectedSubject(subj);
    setSelectedSuggestion(sugg);
    setActiveView('suggestion-detail');
  };

  return (
    <div className="min-h-screen bg-[#FAF6EC] text-[#1B2A4A] flex flex-col font-body">
      
      {/* Top Banner & Header Navigation */}
      <PwaInstallBanner />
      <Navbar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        resetNavigation={resetNavigation} 
      />

      {/* Interactive Breadcrumb Hierarchy */}
      <Breadcrumbs
        selectedYear={selectedYear}
        selectedDept={selectedDept}
        selectedSubject={selectedSubject}
        activeView={activeView}
        setActiveView={setActiveView}
        setSelectedYear={setSelectedYear}
        setSelectedDept={setSelectedDept}
        setSelectedSubject={setSelectedSubject}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'home' && (
          <HomePage
            years={years}
            allSubjects={subjects}
            allSuggestions={suggestions}
            allDepartments={departments}
            onSelectYear={handleSelectYear}
            onSelectSubjectDirectly={handleSelectSubjectDirectly}
            onSelectSuggestionDirectly={handleSelectSuggestionDirectly}
            setActiveView={setActiveView}
          />
        )}

        {activeView === 'departments' && selectedYear && (
          <DepartmentPage
            selectedYear={selectedYear}
            departments={departments}
            subjects={subjects}
            onSelectDepartment={handleSelectDept}
          />
        )}

        {activeView === 'subjects' && selectedYear && selectedDept && (
          <SubjectPage
            selectedYear={selectedYear}
            selectedDept={selectedDept}
            subjects={subjects}
            allSuggestions={suggestions}
            onSelectSubject={handleSelectSubject}
          />
        )}

        {activeView === 'suggestions' && selectedSubject && (
          <SuggestionListPage
            selectedSubject={selectedSubject}
            suggestions={suggestions.filter(s => s.subjectId === selectedSubject.id)}
            allSuggestions={suggestions}
            allSubjects={subjects}
            onSelectSuggestion={handleSelectSuggestion}
          />
        )}

        {activeView === 'suggestion-detail' && selectedSuggestion && (
          <SuggestionDetailPage
            suggestion={selectedSuggestion}
            selectedSubject={selectedSubject}
            setActiveView={setActiveView}
          />
        )}

        {activeView === 'login' && (
          <AuthPage setActiveView={setActiveView} />
        )}

        {activeView === 'admin' && (
          <AdminDashboardPage
            years={years}
            departments={departments}
            subjects={subjects}
            suggestions={suggestions}
            setActiveView={setActiveView}
          />
        )}
      </main>

      {/* Footer - Notebook Styled */}
      <footer className="mt-auto bg-[#1B2A4A] text-white border-t-4 border-[#F2A93B] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <h4 className="font-heading font-extrabold text-[#FAF6EC] text-lg">
              ডিগ্রি সাজেশন ও উত্তর প্ল্যাটফর্ম
            </h4>
            <p className="text-xs text-amber-100/70 mt-1 font-body">
              বাংলাদেশের জাতীয় বিশ্ববিদ্যালয় ডিগ্রি পরীক্ষার্থীদের জন্য বিষয়ভিত্তিক প্রস্তুতকৃত ডিজিটাল সাজেশন পোর্টাল।
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-[#F2A93B]">
            <button onClick={resetNavigation} className="hover:underline">
              হোম পেজ
            </button>
            <span>•</span>
            <button onClick={() => setActiveView('login')} className="hover:underline">
              লগইন / একাউন্ট
            </button>
            <span>•</span>
            <button onClick={() => setActiveView('admin')} className="hover:underline">
              এডমিন প্যানেল
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 pt-4 border-t border-white/10 text-center text-[11px] text-amber-200/60 font-body">
          &copy; {new Date().getFullYear()} ডিগ্রি সাজেশন ও উত্তর — All Rights Reserved. PWA Supported.
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
