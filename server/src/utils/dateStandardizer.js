/**
 * Converts various date formats into ISO 8601 (YYYY-MM-DD).
 *
 * Handles:
 *  - "2026/04/01"       → "2026-04-01"
 *  - "01-04-2026"       → "2026-04-01"  (DD-MM-YYYY)
 *  - "April 1, 2026"    → "2026-04-01"  (Month D, YYYY)
 *  - "March 28, 2026"   → "2026-03-28"
 */

const MONTHS = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
};

function standardizeDate(dateStr) {
  if (!dateStr) return null;

  const trimmed = dateStr.trim();

  // Format: YYYY/MM/DD or YYYY-MM-DD
  if (/^\d{4}[/-]\d{2}[/-]\d{2}$/.test(trimmed)) {
    return trimmed.replace(/\//g, '-');
  }

  // Format: DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const [day, month, year] = trimmed.split('-');
    return `${year}-${month}-${day}`;
  }

  // Format: "Month D, YYYY" or "Month DD, YYYY"
  const monthMatch = trimmed.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  if (monthMatch) {
    const monthNum = MONTHS[monthMatch[1].toLowerCase()];
    if (monthNum) {
      const day = monthMatch[2].padStart(2, '0');
      return `${monthMatch[3]}-${monthNum}-${day}`;
    }
  }

  // Fallback: try native Date parsing
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return trimmed; // return as-is if unparseable
}

module.exports = { standardizeDate };
