import { Suggestion } from '../types';

export type SuggestionSection = 'A' | 'B' | 'C';

export interface SectionMeta {
  key: SuggestionSection;
  name: string;
  bnName: string;
  typeLabel: string;
  description: string;
  marksInfo: string;
  badgeBg: string;
  badgeText: string;
  headerBorder: string;
  accentColor: string;
}

export const SECTIONS_META: Record<SuggestionSection, SectionMeta> = {
  A: {
    key: 'A',
    name: 'ক বিভাগ',
    bnName: 'ক বিভাগ',
    typeLabel: 'অতি সংক্ষিপ্ত প্রশ্ন ও উত্তর',
    description: '১ নম্বরের অতি সংক্ষিপ্ত প্রশ্নোত্তর (প্রশ্ন ও সম্পূর্ণ উত্তর সরাসরি পড়তে পারবেন)',
    marksInfo: 'মান: ১ × ১০ = ১০',
    badgeBg: 'bg-emerald-700',
    badgeText: 'text-emerald-100',
    headerBorder: 'border-emerald-500',
    accentColor: 'emerald'
  },
  B: {
    key: 'B',
    name: 'খ বিভাগ',
    bnName: 'খ বিভাগ',
    typeLabel: 'সংক্ষিপ্ত প্রশ্নাবলী',
    description: '৪ নম্বরের সংক্ষিপ্ত প্রশ্নাবলী (উত্তর দেখতে টগল করুন বা বিস্তারিত পেইজে পড়ুন)',
    marksInfo: 'মান: ৪ × ৫ = ২০',
    badgeBg: 'bg-blue-700',
    badgeText: 'text-blue-100',
    headerBorder: 'border-blue-500',
    accentColor: 'blue'
  },
  C: {
    key: 'C',
    name: 'গ বিভাগ',
    bnName: 'গ বিভাগ',
    typeLabel: 'রচনামূলক প্রশ্নাবলী',
    description: '১০ নম্বরের রচনামূলক প্রশ্নাবলী (উত্তর দেখতে টগল করুন বা বিস্তারিত পেইজে পড়ুন)',
    marksInfo: 'মান: ১০ × ৫ = ৫০',
    badgeBg: 'bg-purple-700',
    badgeText: 'text-purple-100',
    headerBorder: 'border-purple-500',
    accentColor: 'purple'
  }
};

/**
 * Intelligent section detector for legacy or newly created suggestions
 */
export function getSuggestionSection(s: Partial<Suggestion>): SuggestionSection {
  if (s.section === 'A' || s.section === 'B' || s.section === 'C') {
    return s.section;
  }
  
  const title = (s.title || '').toLowerCase();
  
  // Explicit section mentions in title
  if (
    title.includes('ক বিভাগ') || 
    title.includes('ক-বিভাগ') || 
    title.includes('ক )') || 
    title.includes('ক.') || 
    title.includes('অতিসংক্ষিপ্ত') || 
    title.includes('অতি সংক্ষিপ্ত') ||
    title.includes('part a') ||
    title.includes('part-a')
  ) {
    return 'A';
  }

  if (
    title.includes('গ বিভাগ') || 
    title.includes('গ-বিভাগ') || 
    title.includes('গ )') || 
    title.includes('গ.') || 
    title.includes('রচনামূলক') || 
    title.includes('বর্ণনামূলক') ||
    title.includes('part c') ||
    title.includes('part-c')
  ) {
    return 'C';
  }

  if (
    title.includes('খ বিভাগ') || 
    title.includes('খ-বিভাগ') || 
    title.includes('খ )') || 
    title.includes('খ.') || 
    title.includes('সংক্ষিপ্ত') ||
    title.includes('part b') ||
    title.includes('part-b')
  ) {
    return 'B';
  }

  // Content-length based heuristic for unmatched items
  const contentLen = (s.content || '').trim().length;
  if (contentLen > 0 && contentLen <= 180) {
    return 'A';
  } else if (contentLen > 180 && contentLen <= 800) {
    return 'B';
  } else {
    return 'C';
  }
}
