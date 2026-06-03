export async function preprocessForOCR(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Scale up: Tesseract works best with images ≥ 2000px wide
      const scale = Math.max(1, 2400 / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      // Upscale with bicubic-ish interpolation
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const d = imageData.data;

      // Pass 1: grayscale
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = gray;
      }

      // Pass 2: compute mean for adaptive contrast
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += d[i];
      const mean = sum / (d.length / 4);

      // Pass 3: contrast stretch (push darks darker, lights lighter)
      const factor = 1.6;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.min(255, Math.max(0, (d[i] - mean) * factor + mean));
        d[i] = d[i + 1] = d[i + 2] = v;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUrl;
  });
}

export async function applyCrop(
  img: HTMLImageElement,
  crop: { x: number; y: number; width: number; height: number },
): Promise<string> {
  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;
  const canvas = document.createElement('canvas');
  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    img,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0, 0,
    canvas.width,
    canvas.height,
  );
  return canvas.toDataURL('image/jpeg', 0.95);
}
