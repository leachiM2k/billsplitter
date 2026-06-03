import { useLocalStorage } from './hooks/useLocalStorage';
import { parseReceipt } from './lib/parseReceipt';
import type { AppState } from './types';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ReceiptEditor } from './components/ReceiptEditor';
import { PeopleManager } from './components/PeopleManager';
import { SplitView } from './components/SplitView';
import { Summary } from './components/Summary';

const INITIAL_STATE: AppState = {
  step: 'upload',
  imageDataUrl: null,
  receipt: null,
  people: [],
  splitMode: 'items',
  assignments: {},
  percentages: {},
};

const STEPS = ['upload', 'review', 'people', 'assign', 'summary'] as const;

const STEP_META = [
  { label: 'Scan',     icon: '📷' },
  { label: 'Rechnung', icon: '🧾' },
  { label: 'Personen', icon: '👥' },
  { label: 'Aufteilen',icon: '✂️' },
  { label: 'Ergebnis', icon: '🎉' },
] as const;

export default function App() {
  const [state, setState] = useLocalStorage<AppState>('bill-splitter-state', INITIAL_STATE);

  function update(patch: Partial<AppState>) {
    setState({ ...state, ...patch });
  }

  function handleOCRResult(text: string, imageDataUrl: string) {
    const parsed = parseReceipt(text);
    update({
      imageDataUrl,
      receipt: { ...parsed, tip: 0, total: parsed.subtotal },
      step: 'review',
    });
  }

  function reset() {
    localStorage.removeItem('bill-splitter-state');
    setState(INITIAL_STATE);
  }

  const stepIndex = STEPS.indexOf(state.step);
  const isUpload = state.step === 'upload';

  return (
    <div className="min-h-svh flex flex-col" style={{ background: 'var(--color-bg)' }}>
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          background: 'rgba(251,247,240,0.92)',
          backdropFilter: 'blur(12px)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 transition-opacity hover:opacity-75 shrink-0"
          >
            <span className="text-lg">🧾</span>
            <span
              className="font-display text-xl font-semibold leading-none"
              style={{ color: 'var(--color-primary)' }}
            >
              BillSplitter
            </span>
          </button>

          {!isUpload && (
            <div className="flex items-center gap-1.5 flex-1 justify-center">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className="flex items-center gap-1.5"
                >
                  <div
                    className="rounded-full transition-all duration-300"
                    style={{
                      height: '6px',
                      width: i === stepIndex ? '24px' : i < stepIndex ? '10px' : '6px',
                      background: i <= stepIndex ? 'var(--color-primary)' : '#D6CFC7',
                      opacity: i > stepIndex ? 0.5 : 1,
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {!isUpload && (
            <span
              className="text-xs font-medium shrink-0"
              style={{ color: 'var(--color-muted)' }}
            >
              {STEP_META[stepIndex].icon} {STEP_META[stepIndex].label}
            </span>
          )}

          {isUpload && <div className="w-8" />}
        </div>
      </header>

      <main className="flex-1 flex flex-col">
      {state.step === 'upload' && (
        <ReceiptScanner onResult={handleOCRResult} />
      )}

      {state.step === 'review' && state.receipt && (
        <ReceiptEditor
          receipt={state.receipt}
          imageDataUrl={state.imageDataUrl}
          onChange={receipt => update({ receipt })}
          onNext={() => update({ step: 'people' })}
        />
      )}

      {state.step === 'people' && (
        <PeopleManager
          people={state.people}
          onChange={people => update({ people })}
          onNext={() => update({ step: 'assign' })}
          onBack={() => update({ step: 'review' })}
        />
      )}

      {state.step === 'assign' && state.receipt && (
        <SplitView
          receipt={state.receipt}
          people={state.people}
          splitMode={state.splitMode}
          assignments={state.assignments}
          percentages={state.percentages}
          onModeChange={splitMode => update({ splitMode })}
          onAssignmentsChange={assignments => update({ assignments })}
          onPercentagesChange={percentages => update({ percentages })}
          onNext={() => update({ step: 'summary' })}
          onBack={() => update({ step: 'people' })}
        />
      )}

      {state.step === 'summary' && state.receipt && (
        <Summary
          receipt={state.receipt}
          people={state.people}
          splitMode={state.splitMode}
          assignments={state.assignments}
          percentages={state.percentages}
          onReset={reset}
          onBack={() => update({ step: 'assign' })}
        />
      )}
      </main>

      <footer
        className="border-t px-4 py-5 text-center"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
          Open Source · gebaut mit ☕ &amp; ❤️
        </p>
        <a
          href="https://github.com/leachiM2k/billsplitter"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 mt-1.5 text-sm font-medium transition-opacity hover:opacity-75"
          style={{ color: 'var(--color-primary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span>Code auf GitHub</span>
        </a>
      </footer>
    </div>
  );
}
