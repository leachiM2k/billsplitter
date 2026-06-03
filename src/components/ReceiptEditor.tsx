import { useState } from 'react';
import type { Receipt, ReceiptItem } from '../types';

interface Props {
  receipt: Receipt;
  imageDataUrl: string | null;
  onChange: (r: Receipt) => void;
  onNext: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function fmt(n: number) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

const inputCls = [
  'w-full border rounded-xl px-3 py-2 text-sm focus:outline-none transition-shadow',
  'bg-white',
].join(' ');

const inputStyle = {
  borderColor: 'var(--color-border)',
  color: 'var(--color-text)',
};

const focusRing = {
  '--tw-ring-color': 'rgba(194,65,12,0.25)',
} as React.CSSProperties;

export function ReceiptEditor({ receipt, imageDataUrl, onChange, onNext }: Props) {
  const [zoomed, setZoomed] = useState(false);

  function updateItem(id: string, patch: Partial<ReceiptItem>) {
    const items = receipt.items.map(it => it.id === id ? { ...it, ...patch } : it);
    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    onChange({ ...receipt, items, subtotal: Math.round(subtotal * 100) / 100, total: Math.round((subtotal + receipt.tip) * 100) / 100 });
  }

  function removeItem(id: string) {
    const items = receipt.items.filter(it => it.id !== id);
    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
    onChange({ ...receipt, items, subtotal: Math.round(subtotal * 100) / 100, total: Math.round((subtotal + receipt.tip) * 100) / 100 });
  }

  function addItem() {
    const items = [...receipt.items, { id: generateId(), name: '', unitPrice: 0, quantity: 1 }];
    onChange({ ...receipt, items });
  }

  function updateTip(tip: number) {
    onChange({ ...receipt, tip, total: Math.round((receipt.subtotal + tip) * 100) / 100 });
  }

  function parsePrice(s: string): number {
    const v = parseFloat(s.replace(',', '.'));
    return isNaN(v) ? 0 : Math.round(v * 100) / 100;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      {/* Store name */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--color-muted)' }}>
          Geschäft
        </label>
        <input
          className={inputCls}
          style={{ ...inputStyle, ...focusRing }}
          value={receipt.storeName}
          onChange={e => onChange({ ...receipt, storeName: e.target.value })}
          placeholder="Restaurantname"
        />
      </div>

      {/* Receipt image thumbnail — antippen für Vollbild */}
      {imageDataUrl && (
        <button
          type="button"
          onClick={() => setZoomed(true)}
          className="relative block w-full rounded-2xl overflow-hidden border bg-white cursor-zoom-in transition-opacity hover:opacity-95"
          style={{ borderColor: 'var(--color-border)' }}
          aria-label="Rechnungsbild in voller Größe öffnen"
        >
          <img
            src={imageDataUrl}
            alt="Rechnung"
            className="w-full object-contain max-h-44"
          />
          <span className="absolute bottom-2 right-2 flex items-center gap-1 text-xs font-medium text-white px-2 py-1 rounded-lg bg-black/55 backdrop-blur-sm">
            🔍 Vergrößern
          </span>
        </button>
      )}

      {/* Items */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted)' }}>
            Positionen
          </label>
          <button
            onClick={addItem}
            className="text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-75"
            style={{ color: 'var(--color-primary)' }}
          >
            + Hinzufügen
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {receipt.items.map(item => (
            <div
              key={item.id}
              className="bg-white border rounded-2xl p-3.5 flex gap-3 items-start shadow-sm"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex-1 min-w-0 flex flex-col gap-2">
                <input
                  className="w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: '#FAFAF8' }}
                  value={item.name}
                  onChange={e => updateItem(item.id, { name: e.target.value })}
                  placeholder="Bezeichnung"
                />
                <div className="flex gap-2">
                  <label className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-muted)' }}>
                    Menge
                    <input
                      type="number"
                      min="1"
                      className="w-14 border rounded-lg px-2 py-1 text-sm focus:outline-none"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: '#FAFAF8' }}
                      value={item.quantity}
                      onChange={e => updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    />
                  </label>
                  <label className="flex items-center gap-1.5 text-xs flex-1 min-w-0" style={{ color: 'var(--color-muted)' }}>
                    Preis/Stk.
                    <input
                      type="text"
                      inputMode="decimal"
                      className="flex-1 min-w-0 border rounded-lg px-2 py-1 text-sm focus:outline-none"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: '#FAFAF8' }}
                      defaultValue={item.unitPrice.toFixed(2).replace('.', ',')}
                      onBlur={e => updateItem(item.id, { unitPrice: parsePrice(e.target.value) })}
                    />
                  </label>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 pt-1 min-w-[64px]">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {fmt(item.unitPrice * item.quantity)}
                </span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xs transition-colors hover:opacity-100 opacity-40"
                  style={{ color: '#DC2626' }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals card */}
      <div
        className="bg-white border rounded-2xl p-4 flex flex-col gap-3 shadow-sm"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--color-muted)' }}>Zwischensumme</span>
          <span className="font-medium" style={{ color: 'var(--color-text)' }}>{fmt(receipt.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm" style={{ color: 'var(--color-muted)' }}>Trinkgeld</span>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="decimal"
              className="w-24 border rounded-xl px-2.5 py-1.5 text-sm text-right focus:outline-none"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              defaultValue={receipt.tip.toFixed(2).replace('.', ',')}
              onBlur={e => updateTip(parsePrice(e.target.value))}
            />
            <span className="text-sm" style={{ color: 'var(--color-muted)' }}>€</span>
          </div>
        </div>
        <div
          className="border-t pt-3 flex justify-between items-center"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Gesamt</span>
          <span
            className="font-bold text-2xl tabular-nums"
            style={{ color: 'var(--color-primary)' }}
          >
            {fmt(receipt.total)}
          </span>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={receipt.items.length === 0}
        className="text-white font-semibold py-3.5 rounded-2xl transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-40 shadow-md"
        style={{
          background: 'var(--color-primary)',
          boxShadow: '0 4px 14px rgba(194,65,12,0.3)',
        }}
      >
        Weiter → Personen
      </button>

      {/* Vollbild-Ansicht des Rechnungsbilds */}
      {zoomed && imageDataUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setZoomed(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Rechnungsbild"
        >
          <img
            src={imageDataUrl}
            alt="Rechnung in voller Größe"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setZoomed(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white text-xl hover:bg-white/25 transition-colors"
            aria-label="Schließen"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
