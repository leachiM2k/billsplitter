import { useRef, useState } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { applyCrop } from '../lib/preprocessImage';

interface Props {
  imageDataUrl: string;
  onDone: (croppedDataUrl: string) => void;
  onSkip: () => void;
}

const FULL_CROP: Crop = { unit: '%', x: 0, y: 0, width: 100, height: 100 };

export function ImageCropper({ imageDataUrl, onDone, onSkip }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>(FULL_CROP);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCompletedCrop({ unit: 'px', x: 0, y: 0, width, height });
  }

  async function handleCrop() {
    if (!imgRef.current || !completedCrop || completedCrop.width === 0) {
      onSkip();
      return;
    }
    const cropped = await applyCrop(imgRef.current, completedCrop);
    onDone(cropped);
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      <div>
        <h2 className="font-display text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>
          Bereich auswählen
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
          Schneide auf den Rechnungsbereich zu — bessere OCR-Ergebnisse
        </p>
      </div>

      <div
        className="overflow-auto rounded-2xl border"
        style={{ background: '#F5EDE2', borderColor: 'var(--color-border)' }}
      >
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          ruleOfThirds
        >
          <img
            ref={imgRef}
            src={imageDataUrl}
            alt="Rechnung"
            className="max-w-full block"
            style={{ maxHeight: '60vh' }}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          className="flex-1 border font-medium py-3 rounded-2xl transition-colors hover:bg-stone-50"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
        >
          Überspringen
        </button>
        <button
          onClick={handleCrop}
          disabled={!completedCrop || completedCrop.width === 0}
          className="flex-1 text-white font-semibold py-3 rounded-2xl transition-opacity hover:opacity-90 disabled:opacity-40 shadow-md"
          style={{
            background: 'var(--color-primary)',
            boxShadow: '0 4px 14px rgba(194,65,12,0.3)',
          }}
        >
          Zuschneiden & Scannen
        </button>
      </div>
    </div>
  );
}
