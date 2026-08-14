import { SuggestionSection } from './sectionHelper';

export interface ParsedBulkItem {
  id: string; // temporary key for list
  order: number; // sequential question order (1, 2, 3...)
  title: string;
  content: string;
  examYear?: string;
  section: SuggestionSection;
  importance: 'high' | 'medium' | 'normal';
  inSuggestion: boolean;
}

// Convert Bengali numbers to English
export function convertBengaliToEnglish(str: string): string {
  const bnToEnMap: { [key: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return str.replace(/[০-৯]/g, (w) => bnToEnMap[w] || w);
}

// Convert English numbers to Bengali
export function convertEnglishToBengali(str: string | number): string {
  const enToBnMap: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return String(str).replace(/[0-9]/g, (w) => enToBnMap[w] || w);
}

/**
 * Intelligent Bulk Parser for Section A (and other sections)
 * Parses 40-100+ questions from raw text with answers, years, etc.
 */
export function parseBulkQuestionsText(
  rawText: string,
  defaultSection: SuggestionSection = 'A',
  defaultImportance: 'high' | 'medium' | 'normal' = 'high',
  defaultInSuggestion: boolean = true
): ParsedBulkItem[] {
  if (!rawText || !rawText.trim()) return [];

  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n');

  const items: ParsedBulkItem[] = [];

  // Pattern identifying the start of a new question
  // Matches: "১.", "১।", "(১)", "[১]", "১)", "1.", "1)", "(1)", "প্রশ্ন ১:", "প্রশ্ন:", "Q1:", "Q:", "ক.", etc.
  const questionStartRegex = /^\s*(?:(?:প্রশ্ন\s*(?:[০-৯0-9]+)?[:\s\.-]*)|(?:Q(?:uestion)?\s*(?:[০-৯0-9]+)?[:\s\.-]*)|(?:\(?\s*[০-৯0-9]+[\.\)\।\-\:]\s*)|(?:\(\s*[০-৯0-9]+\s*\)\s*)|(?:\(\s*[ক-ঞa-zA-Z]\s*\)\s*)|(?:[ক-ঞ]\s*[\.\।\-\:]\s*))/i;

  let currentBlock: string[] = [];

  const processBlock = (blockLines: string[]) => {
    if (blockLines.length === 0) return;
    const blockText = blockLines.join('\n').trim();
    if (!blockText) return;

    // Try to extract question and answer from the block
    let question = '';
    let answer = '';
    let examYear = '';

    // Check for Exam Year tags like [২০১৮, ২০১৯], (বিগত ২০২০), [2019]
    const yearMatch = blockText.match(/\[(?:বিগত\s*)?([০-৯0-9\s,\/এবং\-]+)\]|\((?:বিগত\s*)?([০-৯0-9\s,\/এবং\-]+)\)/);
    if (yearMatch) {
      examYear = (yearMatch[1] || yearMatch[2] || '').trim();
    }

    // Patterns for answer markers: "উত্তর:", "উত্তরঃ", "উঃ", "উ:", "Ans:", "Answer:"
    const ansMarkerRegex = /(?:\n|\s+)(?:উত্তর|উত্তরঃ|উঃ|উ:|Ans|Answer)\s*[:\s\.\-]/i;
    const splitIndex = blockText.search(ansMarkerRegex);

    if (splitIndex !== -1) {
      question = blockText.substring(0, splitIndex).trim();
      const rawAns = blockText.substring(splitIndex).trim();
      // Clean leading answer marker
      answer = rawAns.replace(/^(?:উত্তর|উত্তরঃ|উঃ|উ:|Ans|Answer)\s*[:\s\.\-]/i, '').trim();
    } else {
      // If no explicit "উত্তর:" marker, check if block has multiple lines
      if (blockLines.length >= 2) {
        question = blockLines[0].trim();
        answer = blockLines.slice(1).join('\n').trim();
      } else {
        // Single line without explicit answer marker
        question = blockText;
        answer = '';
      }
    }

    // Clean leading question numbering for cleaner title, but we can keep or format it nicely
    // Remove year tag from question title if present
    let cleanTitle = question
      .replace(/\[(?:বিগত\s*)?[০-৯0-9\s,\/এবং\-]+\]/g, '')
      .replace(/\((?:বিগত\s*)?[০-৯0-9\s,\/এবং\-]+\)/g, '')
      .trim();

    // Format content nicely (Q + Ans)
    let finalContent = '';
    if (answer) {
      finalContent = `উত্তর: ${answer}`;
    } else {
      finalContent = cleanTitle;
    }

    if (examYear) {
      finalContent += `\n\n[বিগত ${examYear}]`;
    }

    // Extract leading number for strict sequential ordering
    const numMatch = question.match(/^(?:(?:প্রশ্ন|Question|Q)\s*[:\s\.-]*)?(?:\(|\s*)?([০-৯0-9]+)(?:[\.\)\।\-\:\]]|\s+)/i);
    let itemOrder = items.length + 1;
    if (numMatch && numMatch[1]) {
      const enDigits = convertBengaliToEnglish(numMatch[1]);
      const parsedNum = parseInt(enDigits, 10);
      if (!isNaN(parsedNum) && parsedNum > 0 && parsedNum < 10000) {
        itemOrder = parsedNum;
      }
    }

    if (cleanTitle) {
      items.push({
        id: `bulk_${Date.now()}_${items.length}_${Math.random().toString(36).substring(2, 6)}`,
        order: itemOrder,
        title: cleanTitle,
        content: finalContent,
        examYear: examYear || undefined,
        section: defaultSection,
        importance: defaultImportance,
        inSuggestion: defaultInSuggestion
      });
    }
  };

  // Iterate over lines and chunk by question start
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isQuestionStart = questionStartRegex.test(line);

    if (isQuestionStart && currentBlock.length > 0) {
      // Process preceding block
      processBlock(currentBlock);
      currentBlock = [line];
    } else {
      // Also handle double newline as a separator if no explicit number is present
      if (line.trim() === '' && currentBlock.length > 0 && lines[i + 1] && lines[i + 1].trim() !== '') {
        // If current block already has at least question + answer
        const blockStr = currentBlock.join('\n');
        if (/(?:উত্তর|উত্তরঃ|উঃ|উ:|Ans|Answer)/i.test(blockStr)) {
          processBlock(currentBlock);
          currentBlock = [];
          continue;
        }
      }
      currentBlock.push(line);
    }
  }

  if (currentBlock.length > 0) {
    processBlock(currentBlock);
  }

  return items;
}

// Sample questions generator for instant testing
export const SAMPLE_SECTION_A_TEXT = `১. 'বঙ্গাল' শব্দের প্রথম উল্লেখ পাওয়া যায় কোন গ্রন্থে?
উত্তর: 'ঐতরেয় আরণ্যক' গ্রন্থে। [বিগত ২০১৮]

২. 'অখণ্ড স্বাধীন বাংলা' গঠনের প্রস্তাবক কে ছিলেন?
উত্তর: হোসেন শহীদ সোহ্‌রাওয়ার্দী ও আবুল হাশিম। [বিগত ২০১৯]

৩. শেখ মুজিবুর রহমানকে 'বঙ্গবন্ধু' উপাধিতে ভূষিত করা হয় কবে?
উত্তর: ১৯৬৯ সালের ২৩ ফেব্রুয়ারি তোফায়েল আহমেদ রেসকোর্স ময়দানে এ উপাধি দেন। [বিগত ২০২০]

৪. 'আমার ভাইয়ের রক্তে রাঙানো একুশে ফেব্রুয়ারি' গানটির প্রথম সুরকার কে?
উত্তর: আব্দুল লতিফ (পরবর্তীতে আলতাফ মাহমুদ পুনঃসুর করেন)। [বিগত ২০২১]

৫. ১৯৭১ সালের ৭ই মার্চের ভাষণ কোথায় দেওয়া হয়?
উত্তর: ঢাকার তৎকালীন রেসকোর্স ময়দানে (বর্তমান সোহ্‌রাওয়ার্দী উদ্যান)। [বিগত ২০২২]

৬. মুজিবনগর সরকার কত তারিখে শপথ গ্রহণ করে?
উত্তর: ১৯৭১ সালের ১৭ই এপ্রিল মেহেরপুরের বৈদ্যনাথতলার আমবাগানে।

৭. বাংলাদেশের সংবিধান কবে কার্যকর হয়?
উত্তর: ১৯৭২ সালের ১৬ই ডিসেম্বর। [বিগত ২০১৯]

৮. ঐতিহাসিক ৬-দফা কত সালে এবং কোথায় ঘোষণা করা হয়?
উত্তর: ১৯৬৬ সালের ৫-৬ ফেব্রুয়ারি পাকিস্তানের লাহোরে।

৯. মুক্তিযুদ্ধে অবদানের জন্য বীরশ্রেষ্ঠ উপাধি কতজনকে প্রদান করা হয়?
উত্তর: ৭ জন বীর সেনানীকে।

১০. রাষ্ট্রবিজ্ঞানের জনক কে?
উত্তর: গ্রিক দার্শনিক এরিস্টটল (Aristotle)।`;
