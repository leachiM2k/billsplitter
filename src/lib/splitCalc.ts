import type { Receipt, Person, ItemAssignments, SplitMode } from '../types';

export function calcItemSplit(
  receipt: Receipt,
  people: Person[],
  assignments: ItemAssignments,
): Record<string, number> {
  const totals: Record<string, number> = {};
  people.forEach(p => (totals[p.id] = 0));

  let unassignedAmount = 0;

  for (const item of receipt.items) {
    for (let u = 0; u < item.quantity; u++) {
      const key = `${item.id}:${u}`;
      const personId = assignments[key];
      if (personId && totals[personId] !== undefined) {
        totals[personId] += item.unitPrice;
      } else {
        unassignedAmount += item.unitPrice;
      }
    }
  }

  if (unassignedAmount > 0 && people.length > 0) {
    const share = unassignedAmount / people.length;
    people.forEach(p => (totals[p.id] += share));
  }

  if (receipt.tip > 0) {
    const base = Object.values(totals).reduce((s, v) => s + v, 0);
    if (base > 0) {
      people.forEach(p => {
        totals[p.id] += (totals[p.id] / base) * receipt.tip;
      });
    }
  }

  people.forEach(p => {
    totals[p.id] = Math.round(totals[p.id] * 100) / 100;
  });

  return totals;
}

export function calcPercentageSplit(
  total: number,
  people: Person[],
  percentages: Record<string, number>,
): Record<string, number> {
  const totals: Record<string, number> = {};
  people.forEach(p => {
    const pct = percentages[p.id] ?? 0;
    totals[p.id] = Math.round((total * pct) / 100 * 100) / 100;
  });
  return totals;
}

export interface BreakdownLine {
  name: string;
  amount: number;
  shared: boolean;   // true = split equally among all
}

export function calcBreakdown(
  receipt: Receipt,
  people: Person[],
  splitMode: SplitMode,
  assignments: ItemAssignments,
  percentages: Record<string, number>,
  personId: string,
): BreakdownLine[] {
  if (splitMode === 'percentage') {
    const pct = (percentages[personId] ?? 0) / 100;
    const lines: BreakdownLine[] = receipt.items
      .filter(it => it.unitPrice * it.quantity > 0)
      .map(it => ({
        name: it.quantity > 1 ? `${it.name} ×${it.quantity}` : it.name,
        amount: Math.round(it.unitPrice * it.quantity * pct * 100) / 100,
        shared: false,
      }))
      .filter(l => l.amount > 0);

    if (receipt.tip > 0) {
      lines.push({
        name: 'Trinkgeld',
        amount: Math.round(receipt.tip * pct * 100) / 100,
        shared: false,
      });
    }
    return lines;
  }

  // Item mode
  const lines: BreakdownLine[] = [];
  let unassignedTotal = 0;
  let unassignedCount = 0;

  for (const item of receipt.items) {
    for (let u = 0; u < item.quantity; u++) {
      const key = `${item.id}:${u}`;
      const assignedTo = assignments[key];
      if (assignedTo === personId) {
        lines.push({ name: item.name, amount: item.unitPrice, shared: false });
      } else if (!assignedTo || !people.find(p => p.id === assignedTo)) {
        unassignedTotal += item.unitPrice;
        unassignedCount++;
      }
    }
  }

  if (unassignedTotal > 0 && people.length > 0) {
    const share = Math.round((unassignedTotal / people.length) * 100) / 100;
    lines.push({
      name: `Anteil (${unassignedCount} Position${unassignedCount !== 1 ? 'en' : ''} geteilt)`,
      amount: share,
      shared: true,
    });
  }

  if (receipt.tip > 0) {
    const subtotalForPerson = lines.reduce((s, l) => s + l.amount, 0);
    const base = receipt.subtotal || 1;
    lines.push({
      name: 'Trinkgeld (anteilig)',
      amount: Math.round((receipt.tip * subtotalForPerson / base) * 100) / 100,
      shared: true,
    });
  }

  return lines;
}
