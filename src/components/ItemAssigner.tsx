import type { Receipt, Person, ItemAssignments } from '../types';
import { personStyle } from './PeopleManager';

interface Props {
  receipt: Receipt;
  people: Person[];
  assignments: ItemAssignments;
  onChange: (a: ItemAssignments) => void;
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

export function ItemAssigner({ receipt, people, assignments, onChange }: Props) {
  function assign(key: string, personId: string) {
    onChange({ ...assignments, [key]: personId });
  }

  return (
    <div className="flex flex-col gap-2">
      {receipt.items.map(item =>
        Array.from({ length: item.quantity }, (_, u) => {
          const key = `${item.id}:${u}`;
          const assigned = assignments[key] ?? '';
          const personIdx = people.findIndex(p => p.id === assigned);
          const style = personIdx >= 0 ? personStyle(personIdx) : null;

          return (
            <div
              key={key}
              className="bg-white border rounded-2xl px-4 py-3.5 flex items-center gap-3 shadow-sm"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>
                  {item.name}
                  {item.quantity > 1 && (
                    <span className="ml-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                      ({u + 1}/{item.quantity})
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  {fmt(item.unitPrice)}
                </div>
              </div>
              <div className="relative shrink-0">
                <select
                  value={assigned}
                  onChange={e => assign(key, e.target.value)}
                  className="appearance-none text-sm font-semibold rounded-xl px-3 py-2 pr-8 border focus:outline-none cursor-pointer transition-all"
                  style={
                    style
                      ? {
                          background: style.bg,
                          color: style.text,
                          borderColor: style.ring,
                        }
                      : {
                          background: '#FAFAF8',
                          color: 'var(--color-muted)',
                          borderColor: 'var(--color-border)',
                        }
                  }
                >
                  <option value="">Nicht zugewiesen</option>
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <span
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: style ? style.text : 'var(--color-muted)', opacity: 0.7 }}
                >
                  ▾
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
