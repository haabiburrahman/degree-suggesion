import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Year, Department, Subject, Suggestion, UserProfile } from '../types';
import { sortSuggestionsBySerial, extractLeadingNumber } from '../utils/orderHelper';

// ==================== USER FUNCTIONS ====================
export const ADMIN_EMAILS = [
  'habiburraahmancu999@gmail.com',
  'haabiburcu@gmail.com',
  'habiburcu@gmail.com',
  'admin@degree.edu.bd',
  'admin@gmail.com'
];

/**
 * Remove undefined values from object before passing to Firestore
 * (Firestore throws a fatal runtime exception if any field is undefined)
 */
export function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    const val = data[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        cleaned[key] = cleanFirestoreData(val);
      } else {
        cleaned[key] = val;
      }
    }
  }
  return cleaned;
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return (
    ADMIN_EMAILS.some(admin => admin.toLowerCase() === clean) ||
    clean.includes('habibur') ||
    clean.includes('admin')
  );
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as Omit<UserProfile, 'uid'>;
      if (isAdminEmail(data.email) && data.role !== 'admin') {
        data.role = 'admin';
        await updateDoc(doc(db, 'users', uid), { role: 'admin' }).catch(() => {});
      }
      return { uid, ...data };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}

export async function createUserProfile(uid: string, email: string, role: 'admin' | 'user' = 'user'): Promise<UserProfile> {
  const isTargetAdmin = isAdminEmail(email);
  const finalRole = isTargetAdmin ? 'admin' : role;

  const profileData: Omit<UserProfile, 'uid'> = {
    email,
    role: finalRole,
    createdAt: new Date().toISOString()
  };

  try {
    const userRef = doc(db, 'users', uid);
    const existing = await getDoc(userRef);
    if (!existing.exists()) {
      await setDoc(userRef, profileData);
    } else {
      // Return current profile if already exists
      const data = existing.data() as Omit<UserProfile, 'uid'>;
      if (isTargetAdmin && data.role !== 'admin') {
        data.role = 'admin';
        await updateDoc(userRef, { role: 'admin' }).catch(() => {});
      }
      return { uid, ...data };
    }
  } catch (error) {
    console.error('Error creating user profile:', error);
  }

  return { uid, ...profileData };
}

export async function updateUserRole(uid: string, role: 'admin' | 'user'): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), { role });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

// ==================== YEARS FUNCTIONS ====================
export function subscribeYears(callback: (years: Year[]) => void) {
  const q = query(collection(db, 'years'), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const years = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Year[];
    callback(years);
  }, (err) => {
    console.error("Firestore subscribeYears error:", err);
  });
}

export async function addYear(name: string, order: number): Promise<string> {
  const docRef = await addDoc(collection(db, 'years'), { name, order });
  return docRef.id;
}

export async function updateYear(id: string, name: string, order: number): Promise<void> {
  await updateDoc(doc(db, 'years', id), { name, order });
}

export async function deleteYear(id: string): Promise<void> {
  await deleteDoc(doc(db, 'years', id));
}

// ==================== DEPARTMENTS FUNCTIONS ====================
export function subscribeDepartments(callback: (departments: Department[]) => void) {
  const q = query(collection(db, 'departments'), orderBy('order', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const depts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Department[];
    callback(depts);
  }, (err) => {
    console.error("Firestore subscribeDepartments error:", err);
  });
}

export async function addDepartment(name: string, code: string, order: number): Promise<string> {
  const docRef = await addDoc(collection(db, 'departments'), { name, code, order });
  return docRef.id;
}

export async function updateDepartment(id: string, name: string, code: string, order: number): Promise<void> {
  await updateDoc(doc(db, 'departments', id), { name, code, order });
}

export async function deleteDepartment(id: string): Promise<void> {
  await deleteDoc(doc(db, 'departments', id));
}

// ==================== SUBJECTS FUNCTIONS ====================
export function subscribeSubjects(yearId?: string, departmentId?: string, callback?: (subjects: Subject[]) => void) {
  const constraints = [];
  if (yearId) constraints.push(where('yearId', '==', yearId));
  if (departmentId) constraints.push(where('departmentId', '==', departmentId));

  const q = query(collection(db, 'subjects'), ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    const subjects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subject[];
    if (callback) callback(subjects);
  }, (err) => {
    console.error("Firestore subscribeSubjects error:", err);
  });
}

export function subscribeAllSubjects(callback: (subjects: Subject[]) => void) {
  const q = query(collection(db, 'subjects'));
  return onSnapshot(q, (snapshot) => {
    const subjects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Subject[];
    callback(subjects);
  }, (err) => {
    console.error("Firestore subscribeAllSubjects error:", err);
  });
}

export async function addSubject(name: string, yearId: string, departmentId: string): Promise<string> {
  const docRef = await addDoc(collection(db, 'subjects'), { name, yearId, departmentId });
  return docRef.id;
}

export async function updateSubject(id: string, name: string, yearId: string, departmentId: string): Promise<void> {
  await updateDoc(doc(db, 'subjects', id), { name, yearId, departmentId });
}

export async function deleteSubject(id: string): Promise<void> {
  await deleteDoc(doc(db, 'subjects', id));
}

// ==================== SUGGESTIONS FUNCTIONS ====================
export function subscribeSuggestions(subjectId: string, callback: (suggestions: Suggestion[]) => void) {
  const q = query(
    collection(db, 'suggestions'), 
    where('subjectId', '==', subjectId)
  );

  return onSnapshot(q, (snapshot) => {
    const suggestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Suggestion[];
    // Sort strictly in serial order (by order field, title number, and upload sequence)
    const sorted = sortSuggestionsBySerial(suggestions);
    callback(sorted);
  }, (err) => {
    console.error("Firestore subscribeSuggestions error:", err);
  });
}

export function subscribeAllSuggestions(callback: (suggestions: Suggestion[]) => void) {
  const q = query(collection(db, 'suggestions'));
  return onSnapshot(q, (snapshot) => {
    const suggestions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Suggestion[];
    const sorted = sortSuggestionsBySerial(suggestions);
    callback(sorted);
  }, (err) => {
    console.error("Firestore subscribeAllSuggestions error:", err);
  });
}

export async function addSuggestion(data: Omit<Suggestion, 'id' | 'createdAt'>): Promise<string> {
  const extractedOrder = extractLeadingNumber(data.title);
  const finalOrder = typeof data.order === 'number' ? data.order : (extractedOrder !== null ? extractedOrder : undefined);
  
  const cleaned = cleanFirestoreData({
    ...data,
    order: finalOrder,
    createdAt: new Date().toISOString()
  });
  const docRef = await addDoc(collection(db, 'suggestions'), cleaned);
  return docRef.id;
}

/**
 * Bulk insert multiple questions/suggestions in Firestore batches (handles 40-100+ items)
 * Preserves strict sequential upload ordering and numbers
 */
export async function addBulkSuggestions(
  items: Omit<Suggestion, 'id' | 'createdAt'>[],
  onProgress?: (savedCount: number, total: number) => void
): Promise<number> {
  if (!items || items.length === 0) return 0;

  const baseTime = Date.now();
  const BATCH_SIZE = 300; // safe Firestore batch size (limit is 500)
  let totalSaved = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);

    for (let j = 0; j < chunk.length; j++) {
      const item = chunk[j];
      const overallIndex = i + j;
      const newDocRef = doc(collection(db, 'suggestions'));

      const itemOrder = typeof item.order === 'number'
        ? item.order
        : (extractLeadingNumber(item.title) ?? (overallIndex + 1));

      // Spaced timestamps ensure monotonic chronological ordering
      const itemCreatedAt = new Date(baseTime + overallIndex * 100).toISOString();

      const cleanedItem = cleanFirestoreData({
        ...item,
        order: itemOrder,
        createdAt: itemCreatedAt
      });
      batch.set(newDocRef, cleanedItem);
    }

    await batch.commit();
    totalSaved += chunk.length;
    if (onProgress) {
      onProgress(totalSaved, items.length);
    }
  }

  return totalSaved;
}

export async function updateSuggestion(id: string, data: Partial<Omit<Suggestion, 'id'>>): Promise<void> {
  const cleaned = cleanFirestoreData({
    ...data,
    updatedAt: new Date().toISOString()
  });
  await updateDoc(doc(db, 'suggestions', id), cleaned);
}

export async function deleteSuggestion(id: string): Promise<void> {
  await deleteDoc(doc(db, 'suggestions', id));
}

// ==================== SEED INITIAL DATA UTILITY ====================
export async function seedInitialSampleData(): Promise<{ success: boolean; message: string }> {
  try {
    const yearsSnap = await getDocs(collection(db, 'years'));
    if (!yearsSnap.empty) {
      return { success: false, message: 'ডাটাবেজে ইতিমধ্যে তথ্য বিদ্যমান রয়েছে।' };
    }

    // 1. Create Years
    const year1Id = await addYear('১ম বর্ষ (First Year)', 1);
    const year2Id = await addYear('২য় বর্ষ (Second Year)', 2);
    const year3Id = await addYear('৩য় বর্ষ (Third Year)', 3);

    // 2. Create Departments
    const bssId = await addDepartment('বিএসএস (BSS - Bachelor of Social Science)', 'BSS', 1);
    const bscId = await addDepartment('বিএসসি (BSc - Bachelor of Science)', 'BSc', 2);
    const bbaId = await addDepartment('বিবিএ (BBA - Bachelor of Business Admin)', 'BBA', 3);

    // 3. Create Subjects for 1st Year BSS
    const sub1Id = await addSubject('স্বাধীন বাংলাদেশের অভ্যুদয়ের ইতিহাস', year1Id, bssId);
    const sub2Id = await addSubject('রাষ্ট্রবিজ্ঞান ১ম পত্র (রাজনৈতিক তত্ত্ব)', year1Id, bssId);
    const sub3Id = await addSubject('অর্থনীতি ১ম পত্র (ব্যাষ্টি বা অণু অর্থনীতি)', year1Id, bssId);

    // 4. Create Subjects for 2nd Year BSS
    const sub4Id = await addSubject('সমাজবিজ্ঞান ৩য় পত্র', year2Id, bssId);

    // 5. Create Sample Suggestions
    await addSuggestion({
      subjectId: sub1Id,
      title: 'ক-বিভাগ (অতি সংক্ষিপ্ত প্রশ্নাবলি ও উত্তর)',
      content: `১. 'বঙ্গাল' শব্দের প্রথম উল্লেখ পাওয়া যায় কোন গ্রন্থে?\nউত্তর: 'ঐতরেয় আরণ্যক' গ্রন্থে।\n\n২. 'অখণ্ড স্বাধীন বাংলা' গঠনের প্রস্তাবক কে ছিলেন?\nউত্তর: হোসেন শহীদ সোহ্‌রাওয়ার্দী ও আবুল হাশিম।\n\n৩. শেখ মুজিবুর রহমানকে 'বঙ্গবন্ধু' উপাধিতে ভূষিত করা হয় কবে?\nউত্তর: ১৯৬৯ সালের ২৩ ফেব্রুয়ারি তোফায়েল আহমেদ রেসকোর্স ময়দানে এ উপাধি দেন।\n\n৪. 'আমার ভাইয়ের রক্তে রাঙানো একুশে ফেব্রুয়ারি' গানটির প্রথম সুরকার কে?\nউত্তর: আব্দুল লতিফ (পরবর্তীতে আলতাফ মাহমুদ পুনঃসুর করেন)।\n\n৫. ১৯৭১ সালের ৭ই মার্চের ভাষণ কোথায় দেওয়া হয়?\nউত্তর: ঢাকার তৎকালীন রেসকোর্স ময়দানে (বর্তমান সোহ্‌রাওয়ার্দী উদ্যান)।`,
      section: 'A',
      inSuggestion: true,
      importance: 'high',
      contentType: 'suggestion',
      imageUrls: [
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=800&auto=format&fit=crop'
      ],
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    });

    await addSuggestion({
      subjectId: sub1Id,
      title: 'খ-বিভাগ (সংক্ষিপ্ত প্রশ্ন): ১৯৬৬ সালের ৬-দফা কর্মসূচির তাৎপর্য ব্যাখ্যা কর।',
      content: `প্রশ্ন: ১৯৬৬ সালের ঐতিহাসিক ৬-দফা দাবির গুরুত্ব ও তাৎপর্য আলোচনা কর।\n\nউত্তর:\n১৯৬৬ সালের ৫-৬ ফেব্রুয়ারি লাহোরে অনুষ্ঠিত বিরোধী দলগুলোর সম্মেলনে জাতির জনক বঙ্গবন্ধু শেখ মুজিবুর রহমান পূর্ব পাকিস্তানের স্বায়ত্তশাসনের দাবিতে ঐতিহাসিক ৬-দফা পেশ করেন।\n\n৬-দফার মূল দিকসমূহ:\n১. যুক্তরাষ্ট্রীয় সরকার ব্যবস্থা ও সংসদীয় শাসন পদ্ধতি।\n২. কেন্দ্রীয় সরকারের হাতে কেবল প্রতিরক্ষা ও পররাষ্ট্র বিষয় থাকবে।\n৩. দুই অঞ্চলের জন্য আলাদা অথচ সহজে রূপান্তরযোগ্য মুদ্রা ব্যবস্থা।\n৪. রাজস্ব ও কর ধার্য করার ক্ষমতা থাকবে অঙ্গরাজ্যগুলোর হাতে।\n৫. অঙ্গরাজ্যগুলোর বৈদেশিক মুদ্রার পৃথক হিসাব থাকবে।\n৬. আঞ্চলিক নিরাপত্তার জন্য আধা-সামরিক বাহিনী বা প্যারা-মিলিশিয়া গঠনের ক্ষমতা।\n\nতাৎপর্য:\n৬-দফা কর্মসূচিকে বাঙালি জাতির 'ম্যাগনা কার্টা' (Magna Carta) বা মুক্তির সনদ বলা হয়। এটি বাঙালির স্বাধীনতাসংগ্রামের মূল ভিত্তি স্থাপন করেছিল।`,
      section: 'B',
      inSuggestion: true,
      importance: 'high',
      contentType: 'suggestion',
      imageUrls: [
        'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800&auto=format&fit=crop'
      ],
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    });

    await addSuggestion({
      subjectId: sub1Id,
      title: 'গ-বিভাগ (রচনামূলক প্রশ্ন): ১৯৭১ সালের মুক্তিযুদ্ধের পটভূমি ও বঙ্গবন্ধুর ঐতিহাসিক ৭ই মার্চের ভাষণের তাৎপর্য বিশ্লেষণ কর।',
      content: `প্রশ্ন: ১৯৭১ সালের মুক্তিযুদ্ধের পটভূমি এবং ৭ই মার্চের ভাষণের তাৎপর্য ও গুরুত্ব বিস্তারিত আলোচনা কর।\n\nউত্তর:\nভূমিকা:\n১৯৭১ সালের ৭ই মার্চ ঢাকার রেসকোর্স ময়দানে বঙ্গবন্ধু শেখ মুজিবুর রহমানের ভাষণ সমগ্র জাতিকে মুক্তিযুদ্ধে ঝাঁপিয়ে পড়তে প্রস্তুত করেছিল।\n\nমূল পয়েন্টসমূহ:\n১. ১৯৭০ সালের সাধারণ নির্বাচনের ঐতিহাসিক ফলাফল ও পাকিস্তানি জান্তার টালবাহানা।\n২. ১ মার্চ জাতীয় পরিষদ অধিবেশন স্থগিত ও বাঙালি জাতির সার্বিক অসহযোগ আন্দোলন।\n৩. ৭ই মার্চের ভাষণের চার দফা মূল দাবি (সামরিক আইন প্রত্যাহার, সেনাবাহিনীকে ব্যারাকে ফিরিয়ে নেওয়া, গণহত্যার তদন্ত, নির্বাচিত প্রতিনিধিদের হাতে ক্ষমতা হস্তান্তর)।\n৪. 'এবারের সংগ্রাম আমাদের মুক্তির সংগ্রাম, এবারের সংগ্রাম স্বাধীনতার সংগ্রাম' - এই অমর বাণীর মাধ্যমে গেরিলা যুদ্ধের দিকনির্দেশনা।\n\nউপসংহার:\nইউনেস্কো (UNESCO) ২০১৭ সালে এ ভাষণকে 'মেমোরি অব দ্য ওয়ার্ল্ড ইন্টারন্যাশনাল রেজিস্টার'-এ বিশ্ব প্রামাণ্য ঐতিহ্য হিসেবে স্বীকৃতি দেয়।`,
      section: 'C',
      inSuggestion: true,
      importance: 'high',
      contentType: 'suggestion',
      imageUrls: [],
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    });

    await addSuggestion({
      subjectId: sub2Id,
      title: 'ক-বিভাগ: এরিস্টটলের রাষ্ট্রবিজ্ঞান সম্পর্কিত সংজ্ঞা ও মূল উক্তি',
      content: `১. 'মানুষ প্রকৃতিগতভাবেই সামাজিক ও রাজনৈতিক জীব' - উক্তিটি কার?\nউত্তর: গ্রিক দার্শনিক এরিস্টটল।\n\n২. রাষ্ট্রবিজ্ঞানের জনক কে?\nউত্তর: এরিস্টটল (Aristotle)।`,
      section: 'A',
      inSuggestion: true,
      importance: 'high',
      contentType: 'suggestion'
    });

    await addSuggestion({
      subjectId: sub2Id,
      title: 'গ-বিভাগ: রাষ্ট্রবিজ্ঞান ১ম পত্র: প্লাটো-র আদর্শ রাষ্ট্র ধারণা',
      content: `প্রশ্ন: প্লাটোর 'আদর্শ রাষ্ট্র' (Ideal State) ধারণার সমালোচনামূলক মূল্যায়ন কর।\n\nউত্তর:\nগ্রীক দার্শনিক প্লাটো তাঁর বিখ্যাত 'দ্য রিপাবলিক' (The Republic) গ্রন্থে আদর্শ রাষ্ট্রের রূপরেখা তুলে ধরেছেন।\n\nমূল উপাদানসমূহ:\n১. দার্শনিকের শাসন (Rule of Philosopher King)\n২. শ্রম বিভাগ ও বিশেষায়ন\n৩. ন্যায়বিচার (Justice)\n৪. সাম্যবাদ (সম্পদ ও পরিবারের সাম্যবাদ)\n\nসমালোচনা:\nআদর্শ রাষ্ট্রের তত্ত্বটি বাস্তবায়নের দিক থেকে অত্যন্ত কাল্পনিক ও স্বৈরাচারী শাসনের সহায়ক বলে সমালোচিত হয়েছে। তবে রাষ্ট্রচিন্তার ইতিহাসে এটি একটি যুগান্তকারী মাইলফলক।`,
      section: 'C',
      inSuggestion: true,
      importance: 'medium',
      contentType: 'suggestion',
      imageUrls: [],
      pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    });

    return { success: true, message: 'নমুনা তথ্য সফলতা এবং রিয়েল-টাইমে ডাটাবেজে যুক্ত হয়েছে!' };
  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, message: 'ডাটা তৈরি করতে ব্যর্থ হয়েছে: ' + (error as Error).message };
  }
}
