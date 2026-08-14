import { Suggestion } from '../types';
import { convertBengaliToEnglish, convertEnglishToBengali } from './bulkParser';

/**
 * Extract leading number from title (e.g., "১. বঙ্গাল", "২। বঙ্গ", "1. History", "প্রশ্ন ১:", "(৩)")
 */
export function extractLeadingNumber(str: string): number | null {
  if (!str) return null;
  const trimmed = str.trim();
  
  // Matches patterns:
  // "১.", "১।", "১)", "(১)", "[১]", "১-", "১:", "1.", "1)", "(1)", "প্রশ্ন ১:", "প্রশ্ন-১", "Q1:", "Q 1:"
  const match = trimmed.match(/^(?:(?:প্রশ্ন|Question|Q)\s*[:\s\.-]*)?(?:\(|\s*)?([০-৯0-9]+)(?:[\.\)\।\-\:\]]|\s+)/i);
  if (match && match[1]) {
    const enDigits = convertBengaliToEnglish(match[1]);
    const num = parseInt(enDigits, 10);
    if (!isNaN(num) && num > 0 && num < 10000) {
      return num;
    }
  }

  // Also check if string strictly starts with digits
  const directMatch = trimmed.match(/^([০-৯0-9]+)/);
  if (directMatch && directMatch[1]) {
    const enDigits = convertBengaliToEnglish(directMatch[1]);
    const num = parseInt(enDigits, 10);
    if (!isNaN(num) && num > 0 && num < 10000) {
      return num;
    }
  }

  return null;
}

/**
 * Sort suggestions strictly in sequential order:
 * 1. By explicit 'order' field (1, 2, 3...)
 * 2. By extracted leading question number from title (১., ২., ৩... / 1, 2, 3...)
 * 3. By upload timestamp ASCENDING (createdAt oldest -> newest, so 1st uploaded is 1st)
 */
export function sortSuggestionsBySerial(suggestions: Suggestion[]): Suggestion[] {
  return [...suggestions].sort((a, b) => {
    // 1. Explicit order field
    const orderA = typeof a.order === 'number' ? a.order : null;
    const orderB = typeof b.order === 'number' ? b.order : null;

    if (orderA !== null && orderB !== null && orderA !== orderB) {
      return orderA - orderB;
    }
    if (orderA !== null && orderB === null) return -1;
    if (orderA === null && orderB !== null) return 1;

    // 2. Extract leading number from title
    const numA = extractLeadingNumber(a.title);
    const numB = extractLeadingNumber(b.title);

    if (numA !== null && numB !== null && numA !== numB) {
      return numA - numB;
    }
    if (numA !== null && numB === null) return -1;
    if (numA === null && numB !== null) return 1;

    // 3. Fallback to upload timestamp ASCENDING (Chronological order)
    const timeA = a.createdAt || '';
    const timeB = b.createdAt || '';
    if (timeA && timeB && timeA !== timeB) {
      return timeA.localeCompare(timeB);
    }

    return (a.id || '').localeCompare(b.id || '');
  });
}

/**
 * Format serial number in Bengali (e.g. 1 -> "১", 45 -> "৪৫")
 */
export function formatBnSerial(num: number): string {
  return convertEnglishToBengali(num);
}
