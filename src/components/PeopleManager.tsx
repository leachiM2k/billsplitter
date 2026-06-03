import { useState } from 'react';
import type { Person } from '../types';

interface Props {
  people: Person[];
  onChange: (people: Person[]) => void;
  onNext: () => void;
  onBack: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

const PERSON_STYLES = [
  { bg: '#FEE9D8', text: '#9A3412', ring: '#FBD0B0' },
  { bg: '#FCE7F3', text: '#9D174D', ring: '#FBCFE8' },
  { bg: '#FEF3C7', text: '#92400E', ring: '#FDE68A' },
  { bg: '#D1FAE5', text: '#065F46', ring: '#A7F3D0' },
  { bg: '#DBEAFE', text: '#1E40AF', ring: '#BFDBFE' },
  { bg: '#EDE9FE', text: '#5B21B6', ring: '#DDD6FE' },
];

export function personColor(index: number) {
  const s = PERSON_STYLES[index % PERSON_STYLES.length];
  return `bg-[${s.bg}] text-[${s.text}]`;
}

export function personStyle(index: number) {
  return PERSON_STYLES[index % PERSON_STYLES.length];
}

export function PeopleManager({ people, onChange, onNext, onBack }: Props) {
  const [input, setInput] = useState('');

  function add() {
    const name = input.trim();
    if (!name) return;
    onChange([...people, { id: generateId(), name }]);
    setInput('');
  }

  function remove(id: string) {
    onChange(people.filter(p => p.id !== id));
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Wer ist dabei?
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          Füge alle Personen hinzu, die die Rechnung teilen.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-3 text-base focus:outline-none transition-shadow"
          style={{
            borderColor: 'var(--color-border)',
            background: 'white',
            color: 'var(--color-text)',
          }}
          placeholder="Name eingeben…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="text-white font-bold px-5 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: 'var(--color-primary)' }}
        >
          +
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {people.map((p, i) => {
          const style = personStyle(i);
          return (
            <div
              key={p.id}
              className="flex items-center gap-3 bg-white border rounded-2xl px-4 py-3 shadow-sm"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: style.bg, color: style.text }}
              >
                {p.name[0]?.toUpperCase()}
              </span>
              <span className="flex-1 font-medium" style={{ color: 'var(--color-text)' }}>
                {p.name}
              </span>
              <button
                onClick={() => remove(p.id)}
                className="transition-opacity opacity-30 hover:opacity-80 text-sm"
                style={{ color: '#DC2626' }}
              >
                ✕
              </button>
            </div>
          );
        })}
        {people.length === 0 && (
          <div
            className="text-center py-8 rounded-2xl border-2 border-dashed"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
          >
            <div className="text-3xl mb-2">👥</div>
            <p className="text-sm">Noch keine Personen hinzugefügt</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 border font-medium py-3 rounded-2xl transition-colors hover:bg-stone-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
          ← Zurück
        </button>
        <button
          onClick={onNext}
          disabled={people.length === 0}
          className="flex-1 text-white font-semibold py-3 rounded-2xl transition-opacity hover:opacity-90 disabled:opacity-40 shadow-md"
          style={{
            background: 'var(--color-primary)',
            boxShadow: '0 4px 14px rgba(194,65,12,0.3)',
          }}
        >
          Weiter → Aufteilen
        </button>
      </div>
    </div>
  );
}
