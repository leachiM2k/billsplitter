import type { Person } from '../types';
import { personStyle } from './PeopleManager';

interface Props {
  people: Person[];
  percentages: Record<string, number>;
  total: number;
  onChange: (p: Record<string, number>) => void;
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

export function PercentageSplitter({ people, percentages, total, onChange }: Props) {
  const sum = people.reduce((s, p) => s + (percentages[p.id] ?? 0), 0);
  const remaining = Math.round((100 - sum) * 10) / 10;
  const isValid = Math.abs(remaining) < 0.1;

  function setPercent(id: string, value: number) {
    onChange({ ...percentages, [id]: Math.max(0, Math.min(100, value)) });
  }

  function distribute() {
    const equal = Math.round((100 / people.length) * 10) / 10;
    const updated: Record<string, number> = {};
    people.forEach((p, i) => {
      updated[p.id] = i === people.length - 1
        ? Math.round((100 - equal * (people.length - 1)) * 10) / 10
        : equal;
    });
    onChange(updated);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div
          className="text-sm font-semibold flex items-center gap-1.5"
          style={{ color: isValid ? '#065F46' : '#92400E' }}
        >
          <span>{isValid ? '✓' : '○'}</span>
          <span>
            {isValid
              ? '100% aufgeteilt'
              : `Verbleibend: ${remaining > 0 ? '+' : ''}${remaining}%`}
          </span>
        </div>
        <button
          onClick={distribute}
          className="text-sm font-semibold transition-opacity hover:opacity-75"
          style={{ color: 'var(--color-primary)' }}
        >
          Gleich aufteilen
        </button>
      </div>

      {people.map((p, i) => {
        const pct = percentages[p.id] ?? 0;
        const amount = Math.round(total * pct / 100 * 100) / 100;
        const style = personStyle(i);

        return (
          <div
            key={p.id}
            className="bg-white border rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: style.bg, color: style.text }}
            >
              {p.name[0]?.toUpperCase()}
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {p.name}
                </span>
                <span className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>
                  {fmt(amount)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="0.5"
                value={pct}
                onChange={e => setPercent(p.id, parseFloat(e.target.value))}
              />
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={pct}
                onChange={e => setPercent(p.id, parseFloat(e.target.value) || 0)}
                className="w-14 border rounded-xl px-2 py-1.5 text-sm text-right focus:outline-none"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                  background: '#FAFAF8',
                }}
              />
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
