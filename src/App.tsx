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
    <div className="min-h-svh" style={{ background: 'var(--color-bg)' }}>
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
    </div>
  );
}
