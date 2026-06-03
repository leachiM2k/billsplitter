import type { Receipt, Person, ItemAssignments, SplitMode } from '../types';
import { ItemAssigner } from './ItemAssigner';
import { PercentageSplitter } from './PercentageSplitter';

interface Props {
  receipt: Receipt;
  people: Person[];
  splitMode: SplitMode;
  assignments: ItemAssignments;
  percentages: Record<string, number>;
  onModeChange: (m: SplitMode) => void;
  onAssignmentsChange: (a: ItemAssignments) => void;
  onPercentagesChange: (p: Record<string, number>) => void;
  onNext: () => void;
  onBack: () => void;
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

export function SplitView({
  receipt, people, splitMode, assignments, percentages,
  onModeChange, onAssignmentsChange, onPercentagesChange, onNext, onBack,
}: Props) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Aufteilen
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          Gesamt: <span className="font-semibold" style={{ color: 'var(--color-primary)' }}>{fmt(receipt.total)}</span>
        </p>
      </div>

      {/* Mode toggle */}
      <div
        className="flex rounded-2xl p-1 gap-1"
        style={{ background: '#EDE8E3' }}
      >
        {(['items', 'percentage'] as SplitMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={
              splitMode === mode
                ? {
                    background: 'white',
                    color: 'var(--color-primary)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }
                : { color: 'var(--color-muted)' }
            }
          >
            {mode === 'items' ? '🍽 Pro Position' : '% Prozentual'}
          </button>
        ))}
      </div>

      {splitMode === 'items' ? (
        <ItemAssigner
          receipt={receipt}
          people={people}
          assignments={assignments}
          onChange={onAssignmentsChange}
        />
      ) : (
        <PercentageSplitter
          people={people}
          percentages={percentages}
          total={receipt.total}
          onChange={onPercentagesChange}
        />
      )}

      <div className="flex gap-3 mt-2">
        <button
          onClick={onBack}
          className="flex-1 border font-medium py-3 rounded-2xl transition-colors hover:bg-stone-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
          ← Zurück
        </button>
        <button
          onClick={onNext}
          className="flex-1 text-white font-semibold py-3 rounded-2xl transition-opacity hover:opacity-90 shadow-md"
          style={{
            background: 'var(--color-primary)',
            boxShadow: '0 4px 14px rgba(194,65,12,0.3)',
          }}
        >
          Zusammenfassung →
        </button>
      </div>
    </div>
  );
}
