import { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import { preprocessForOCR } from '../lib/preprocessImage';

export type OCRStatus = 'idle' | 'preprocessing' | 'loading' | 'done' | 'error';

export function useOCR() {
  const [status, setStatus] = useState<OCRStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognize = useCallback(async (imageDataUrl: string): Promise<string | null> => {
    setStatus('preprocessing');
    setProgress(0);
    setError(null);
    let worker;
    try {
      const processed = await preprocessForOCR(imageDataUrl);
      setStatus('loading');

      worker = await createWorker('deu+eng', 1, {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      // PSM 6 = single uniform block, works well for receipts
      await worker.setParameters({ tessedit_pageseg_mode: '6' as never });

      const result = await worker.recognize(processed);
      setStatus('done');
      setProgress(100);
      return result.data.text;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'OCR fehlgeschlagen');
      setStatus('error');
      return null;
    } finally {
      if (worker) await worker.terminate();
    }
  }, []);

  return { recognize, status, progress, error };
}
