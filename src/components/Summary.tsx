import type { Receipt, Person, ItemAssignments, SplitMode } from '../types';
import { calcItemSplit, calcPercentageSplit, calcBreakdown } from '../lib/splitCalc';
import { personStyle } from './PeopleManager';

interface Props {
  receipt: Receipt;
  people: Person[];
  splitMode: SplitMode;
  assignments: ItemAssignments;
  percentages: Record<string, number>;
  onReset: () => void;
  onBack: () => void;
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

export function Summary({ receipt, people, splitMode, assignments, percentages, onReset, onBack }: Props) {
  const totals = splitMode === 'items'
    ? calcItemSplit(receipt, people, assignments)
    : calcPercentageSplit(receipt.total, people, percentages);

  const maxAmount = Math.max(...people.map(p => totals[p.id] ?? 0));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      <div className="text-center py-2">
        <div className="text-4xl mb-2">🎉</div>
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Fertig!
        </h2>
        {receipt.storeName && (
          <p className="text-sm mt-1 italic font-display" style={{ color: 'var(--color-muted)' }}>
            {receipt.storeName}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {people.map((p, i) => {
          const amount = totals[p.id] ?? 0;
          const breakdown = calcBreakdown(receipt, people, splitMode, assignments, percentages, p.id);
          const style = personStyle(i);
          const barWidth = maxAmount > 0 ? Math.round((amount / maxAmount) * 100) : 0;

          return (
            <div
              key={p.id}
              className="bg-white border rounded-2xl overflow-hidden shadow-sm"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {/* Colored header strip */}
              <div
                className="px-4 pt-4 pb-3"
                style={{ background: style.bg }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold shrink-0"
                    style={{ background: 'white', color: style.text, boxShadow: `0 0 0 2px ${style.ring}` }}
                  >
                    {p.name[0]?.toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate" style={{ color: style.text }}>
                      {p.name}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: style.text, opacity: 0.7 }}>
                      {breakdown.length} Position{breakdown.length !== 1 ? 'en' : ''}
                    </div>
                  </div>
                  <div
                    className="font-bold text-2xl tabular-nums shrink-0"
                    style={{ color: style.text }}
                  >
                    {fmt(amount)}
                  </div>
                </div>

                {/* Proportional bar */}
                <div
                  className="mt-3 rounded-full overflow-hidden"
                  style={{ height: '4px', background: 'rgba(0,0,0,0.1)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${barWidth}%`, background: style.text }}
                  />
                </div>
              </div>

              {/* Item breakdown */}
              {breakdown.length > 0 && (
                <div
                  className="divide-y"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {breakdown.map((b, j) => (
                    <div
                      key={j}
                      className="flex items-center justify-between px-4 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {b.shared && (
                          <span
                            className="shrink-0 text-[10px] rounded px-1 py-0.5 leading-none font-medium"
                            style={{ background: '#F5EDE2', color: 'var(--color-muted)' }}
                          >
                            ÷
                          </span>
                        )}
                        <span className="text-sm truncate" style={{ color: 'var(--color-muted)' }}>
                          {b.name}
                        </span>
                      </div>
                      <span className="text-sm font-medium ml-3 shrink-0" style={{ color: 'var(--color-text)' }}>
                        {fmt(b.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grand total */}
      <div
        className="border rounded-2xl px-4 py-4 flex justify-between items-center"
        style={{ background: 'white', borderColor: 'var(--color-border)' }}
      >
        <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Gesamt</span>
        <span
          className="font-bold text-2xl tabular-nums"
          style={{ color: 'var(--color-primary)' }}
        >
          {fmt(receipt.total)}
        </span>
      </div>

      <div className="flex gap-3 mt-1">
        <button
          onClick={onBack}
          className="flex-1 border font-medium py-3 rounded-2xl transition-colors hover:bg-stone-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
          ← Zurück
        </button>
        <button
          onClick={onReset}
          className="flex-1 border font-semibold py-3 rounded-2xl transition-colors"
          style={{
            background: '#FFF1F0',
            borderColor: '#FECACA',
            color: '#991B1B',
          }}
        >
          Neue Rechnung
        </button>
      </div>
    </div>
  );
}
