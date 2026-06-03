import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { useOCR } from '../hooks/useOCR';
import { ImageCropper } from './ImageCropper';

interface Props {
  onResult: (text: string, imageDataUrl: string) => void;
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|bmp|tiff?|avif|heic|heif)$/i;
const HEIC_EXTENSIONS = /\.(heic|heif)$/i;

function looksLikeImage(file: File): boolean {
  return file.type.startsWith('image/') || IMAGE_EXTENSIONS.test(file.name);
}

function isHeicFile(file: File): boolean {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    HEIC_EXTENSIONS.test(file.name)
  );
}

async function convertToDataUrl(file: File): Promise<string> {
  if (!isHeicFile(file)) return blobToDataUrl(file);

  const heicBlob = file.type ? file : new Blob([await file.arrayBuffer()], { type: 'image/heic' });

  try {
    return await imgElementToJpeg(URL.createObjectURL(heicBlob));
  } catch {
    // Not natively supported — try next
  }

  try {
    const bitmap = await createImageBitmap(heicBlob);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    // Fall through
  }

  try {
    const { heicTo } = await import('heic-to');
    const outBlob = await heicTo({ blob: heicBlob, type: 'image/jpeg', quality: 0.92 });
    return blobToDataUrl(outBlob);
  } catch (e) {
    const detail = e instanceof Error ? e.message
      : typeof e === 'string' ? e
      : (e != null && typeof (e as Record<string, unknown>).message === 'string') ? String((e as Record<string, unknown>).message)
      : JSON.stringify(e);
    throw new Error(`HEIC-Konvertierung fehlgeschlagen: ${detail}`);
  }
}

function imgElementToJpeg(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        const jpeg = canvas.toDataURL('image/jpeg', 0.92);
        URL.revokeObjectURL(src);
        resolve(jpeg);
      } catch (err) {
        URL.revokeObjectURL(src);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(src);
      reject(new Error('Image load failed'));
    };
    img.src = src;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target!.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

const STATUS_LABELS: Record<string, string> = {
  preprocessing: 'Bild wird optimiert…',
  loading: 'Text wird erkannt…',
};

export function ReceiptScanner({ onResult }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const { recognize, status, progress, error } = useOCR();
  const [dragging, setDragging] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [convertError, setConvertError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setConvertError(null);
    try {
      const dataUrl = await convertToDataUrl(file);
      setRawImage(dataUrl);
    } catch (e) {
      setConvertError(e instanceof Error ? e.message : 'Datei konnte nicht gelesen werden');
    }
  }

  async function startOCR(imageDataUrl: string) {
    setRawImage(null);
    const text = await recognize(imageDataUrl);
    if (text) onResult(text, imageDataUrl);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && looksLikeImage(file)) handleFile(file);
  }

  const isLoading = status === 'loading' || status === 'preprocessing';

  if (rawImage && !isLoading) {
    return (
      <ImageCropper
        imageDataUrl={rawImage}
        onDone={(cropped) => startOCR(cropped)}
        onSkip={() => startOCR(rawImage)}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100svh-57px)]">
      {/* Hero section */}
      <div
        className="relative flex flex-col items-center justify-center px-6 py-14 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #FFF3E8 0%, #FBF7F0 55%, #F5EDE2 100%)',
        }}
      >
        {/* Decorative receipt lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.035]">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-full border-t border-stone-900"
              style={{ top: `${6 + i * 7}%` }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md"
            style={{ background: 'var(--color-primary)' }}
          >
            🧾
          </div>

          <div>
            <h1
              className="font-display text-5xl font-bold leading-tight tracking-tight"
              style={{ color: 'var(--color-primary)' }}
            >
              BillSplitter
            </h1>
            <p
              className="font-display italic text-lg mt-2 leading-snug"
              style={{ color: '#92400E' }}
            >
              Teile die Rechnung.
              <br />
              Nicht die Freundschaft.
            </p>
          </div>

          <div
            className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border mt-1"
            style={{
              color: '#92400E',
              borderColor: '#FCD9A8',
              background: '#FFF7ED',
            }}
          >
            <span>🔒</span>
            <span>100% privat · Kein Server · Keine Cloud</span>
          </div>
        </div>
      </div>

      {/* Upload section */}
      <div className="flex-1 flex flex-col gap-4 px-4 py-6 max-w-md mx-auto w-full">
        {!isLoading && (
          <>
            <div
              className="w-full border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer transition-all duration-200"
              style={{
                borderColor: dragging ? 'var(--color-primary)' : 'var(--color-border)',
                background: dragging ? '#FFF3E8' : 'white',
              }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-4xl mb-3">📂</div>
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                Bild hierher ziehen oder klicken
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                JPG · PNG · HEIC
              </p>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={onInputChange}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>oder</span>
              <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            </div>

            <button
              className="flex items-center justify-center gap-2.5 text-white font-semibold py-3.5 px-6 rounded-2xl transition-opacity hover:opacity-90 active:scale-[0.98] shadow-md"
              style={{ background: 'var(--color-primary)', boxShadow: '0 4px 14px rgba(194,65,12,0.3)' }}
              onClick={() => cameraRef.current?.click()}
            >
              <span className="text-lg">📷</span>
              <span>Kamera öffnen</span>
            </button>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*,.heic,.heif"
              capture="environment"
              className="hidden"
              onChange={onInputChange}
            />
          </>
        )}

        {isLoading && (
          <div className="flex flex-col items-center gap-5 py-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-pulse"
              style={{ background: '#FFF3E8' }}
            >
              🔍
            </div>
            <div className="text-center">
              <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                {STATUS_LABELS[status] ?? 'Wird verarbeitet…'}
              </p>
              {status === 'loading' && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted)' }}>
                  {progress}%
                </p>
              )}
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: '6px', background: '#E5DDD4' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: status === 'preprocessing' ? '15%' : `${Math.max(15, progress)}%`,
                  background: 'linear-gradient(90deg, var(--color-primary), #E97131)',
                }}
              />
            </div>
          </div>
        )}

        {(error || convertError) && (
          <div
            className="rounded-2xl p-4 text-sm border"
            style={{
              background: '#FFF1F0',
              borderColor: '#FECACA',
              color: '#991B1B',
            }}
          >
            {error ?? convertError}
          </div>
        )}
      </div>
    </div>
  );
}
