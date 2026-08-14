export type UserRole = 'admin' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Year {
  id: string;
  name: string; // e.g., '১ম বর্ষ', '২য় বর্ষ', '৩য় বর্ষ'
  order: number;
}

export interface Department {
  id: string;
  name: string; // e.g., 'বিএসএস (BSS)', 'বিএসসি (BSc)', 'বিবিএ (BBA)'
  code: string; // e.g., 'BSS', 'BSc', 'BBA'
  order: number;
}

export interface Subject {
  id: string;
  name: string; // e.g., 'স্বাধীন বাংলাদেশের অভ্যুদয়ের ইতিহাস'
  yearId: string;
  departmentId: string;
}

export interface Suggestion {
  id: string;
  subjectId: string;
  title: string;
  content: string; // Detailed question & answer text
  imageUrls?: string[]; // List of image URLs or base64 strings
  pdfUrl?: string; // Optional PDF URL or base64 data link
  websiteUrl?: string; // Optional Website link for external resource
  section?: 'A' | 'B' | 'C'; // 'A' = ক বিভাগ, 'B' = খ বিভাগ, 'C' = গ বিভাগ
  contentType?: 'suggestion' | 'question'; // 'suggestion' = সাজেশন, 'question' = প্রশ্ন/প্রশ্নব্যাংক
  inSuggestion?: boolean; // True if this question/item is selected for the current active suggestion
  importance?: 'high' | 'medium' | 'normal'; // 'high' = ⭐⭐⭐ ৯৯% কমন, 'medium' = ⭐⭐ ৯০% কমন, 'normal' = ⭐ সাধারণ
  examYear?: string; // e.g., '২০২৪', '২০২৩', '২০২২' (বিগত পরীক্ষার সাল)
  targetSession?: string; // e.g., '২০২৬', '২০২৫-২০২৬' (টার্গেট পরীক্ষার সাল)
  createdAt: string;
  updatedAt?: string;
}

export type ActiveView = 
  | 'home' 
  | 'departments' 
  | 'subjects' 
  | 'suggestions' 
  | 'suggestion-detail' 
  | 'login' 
  | 'admin';

export interface BreadcrumbItem {
  label: string;
  view: ActiveView;
  id?: string;
}
