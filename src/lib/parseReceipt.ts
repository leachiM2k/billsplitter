import type { Receipt, ReceiptItem } from '../types';

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

// Parse German/European price strings
function parseGermanPrice(s: string): number | null {
  const c = s.replace(/\s/g, '');
  // 1.234,56 or 1,234.56 (thousands + decimal)
  if (/^\d{1,3}([.,]\d{3})+[.,]\d{2}$/.test(c)) {
    // Determine decimal separator: last separator
    const lastSep = c.match(/[.,](?=\d{2}$)/)?.[0];
    if (lastSep === ',') return parseFloat(c.replace(/\./g, '').replace(',', '.'));
    if (lastSep === '.') return parseFloat(c.replace(/,/g, ''));
  }
  // 1234,56 or 1234.56
  if (/^\d+[,.]\d{1,2}$/.test(c)) {
    return parseFloat(c.replace(',', '.'));
  }
  // Integer
  if (/^\d+$/.test(c)) return parseInt(c, 10);
  return null;
}

// Finds all price-like tokens in a string, returns their match + parsed value
function findPrices(line: string): Array<{ raw: string; value: number; index: number }> {
  const re = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})/g;
  const results = [];
  let m;
  while ((m = re.exec(line)) !== null) {
    const v = parseGermanPrice(m[1]);
    if (v !== null && v > 0) results.push({ raw: m[1], value: v, index: m.index });
  }
  return results;
}

const TOTAL_KEYWORDS = /gesamt|total|summe|zu zahlen|endbetrag|trinkgeld|netto|brutto|inkl\.|mwst/i;
const SKIP_KEYWORDS = /steuernr|datum|uhrzeit|tisch|kellner|bedien|bon-?nr|beleg|rechnungs-?nr|vielen dank|danke|tel|fax|www|http|öffnung|strasse|straße|gasse|allee|platz|weg|^[_\-=*#]+$|tischno|seite \d/i;

// Clean up OCR noise from item names
function cleanName(s: string): string {
  return s
    .replace(/[|\\{}[\]<>]/g, '')   // OCR artifacts
    .replace(/\s{2,}/g, ' ')         // multiple spaces
    .replace(/[-_.]+$/, '')           // trailing separators
    .replace(/^[-_.]+/, '')           // leading separators
    .trim();
}

const QTY_PREFIX = /^(\d{1,2})\s*[xX×]\s+(.+)/;

export function parseReceipt(ocrText: string): Omit<Receipt, 'tip' | 'total'> {
  const rawLines = ocrText.split('\n');
  const lines = rawLines.map(l => l.trim()).filter(l => l.length > 1);

  // Store name: first non-empty line that's not all digits/symbols
  let storeName = '';
  for (const line of lines) {
    if (/[a-zA-ZäöüÄÖÜß]{3,}/.test(line) && !TOTAL_KEYWORDS.test(line)) {
      storeName = cleanName(line);
      break;
    }
  }

  const items: ReceiptItem[] = [];
  let subtotal = 0;
  let maxTotal = 0;

  for (const line of lines) {
    if (SKIP_KEYWORDS.test(line)) continue;

    const prices = findPrices(line);
    if (prices.length === 0) continue;

    // Detect total/subtotal lines first
    if (TOTAL_KEYWORDS.test(line)) {
      const last = prices[prices.length - 1];
      if (last.value > maxTotal) maxTotal = last.value;
      continue;
    }

    let unitPrice: number;
    let quantity: number;
    let nameEnd: number;

    if (prices.length >= 2) {
      // Check for pattern: "… unitPrice totalPrice"
      // e.g. "2 Yuzu Tee 4,50 9,00" → 9,00/4,50 = 2 → qty=2, unit=4,50
      const p1 = prices[prices.length - 2];
      const p2 = prices[prices.length - 1];
      const roundedRatio = Math.round(p2.value / p1.value);
      const expectedTotal = Math.round(p1.value * roundedRatio * 100) / 100;
      const isUnitTotalPair =
        roundedRatio >= 1 &&
        roundedRatio <= 20 &&
        Math.abs(expectedTotal - p2.value) < 0.011; // allow ≤1 cent rounding

      if (isUnitTotalPair) {
        unitPrice = p1.value;
        quantity = roundedRatio;
        nameEnd = p1.index; // name ends before the unit price
      } else {
        unitPrice = p2.value;
        quantity = 1;
        nameEnd = p2.index;
      }
    } else {
      unitPrice = prices[0].value;
      quantity = 1;
      nameEnd = prices[0].index;
    }

    let name = cleanName(line.slice(0, nameEnd));
    if (!name || name.length < 2) continue;
    if (/^[\d\s.,€%*#_-]+$/.test(name)) continue;

    if (quantity > 1) {
      // Strip leading quantity marker: "3 ", "3x ", "2× ", etc.
      // Trust the price-derived quantity; strip whatever number is there
      const stripped = name.replace(/^\d+\s*[xX×]?\s*/, '').trim();
      if (stripped.length >= 2) name = cleanName(stripped);
    } else {
      // Single price: check for explicit "Nx " or "N× " quantity prefix
      const qtyMatch = name.match(QTY_PREFIX);
      if (qtyMatch) {
        const q = parseInt(qtyMatch[1], 10);
        if (q >= 2 && q <= 20) {
          quantity = q;
          unitPrice = Math.round((unitPrice / q) * 100) / 100;
          name = cleanName(qtyMatch[2]);
        }
      }
    }

    if (!name || name.length < 2) continue;
    if (unitPrice <= 0 || unitPrice > 500) continue;

    items.push({ id: generateId(), name, unitPrice, quantity });
  }

  // Subtotal: prefer keyword-found total, else sum of items
  if (maxTotal > 0) {
    subtotal = maxTotal;
  } else {
    subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  }

  subtotal = Math.round(subtotal * 100) / 100;

  return { storeName, items, subtotal };
}
