/**
 * Client-side image compression utility.
 * Compresses an image File, Blob, or base64 string to a bounded bounding box (maxWidth=800, maxHeight=800).
 * Detects PNG transparency: preserves PNG format with transparent alpha channel,
 * otherwise encodes to JPEG (quality=0.82).
 * Guarantees a clean Base64 data URL string under 150KB.
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const hasAlphaChannel = (ctx: CanvasRenderingContext2D, width: number, height: number): boolean => {
  try {
    const imgData = ctx.getImageData(0, 0, width, height).data;
    // Step through pixels (sampling for speed on large canvases)
    const step = Math.max(1, Math.floor((width * height) / 10000)) * 4;
    for (let i = 3; i < imgData.length; i += step) {
      if (imgData[i] < 250) {
        return true;
      }
    }
  } catch {
    // If getImageData fails due to security or canvas limits, fallback false
    return false;
  }
  return false;
};

export const compressImage = async (
  input: File | Blob | string,
  options: CompressImageOptions = {}
): Promise<string> => {
  const { maxWidth = 800, maxHeight = 800, quality = 0.82 } = options;

  let base64Source: string;
  let isPngHint = false;

  if (typeof input === 'string') {
    base64Source = input;
    isPngHint = input.startsWith('data:image/png');
  } else {
    isPngHint = input.type === 'image/png';
    base64Source = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen'));
      reader.readAsDataURL(input);
    });
  }

  if (!base64Source || !base64Source.startsWith('data:image')) {
    return base64Source;
  }

  return new Promise<string>((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('[ImageCompression] Compresión excedió tiempo límite, usando original');
      resolve(base64Source);
    }, 8000);

    const img = new Image();
    img.src = base64Source;

    img.onload = () => {
      clearTimeout(timeout);
      let { width, height } = img;

      // Calculate proportional bounding box
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(base64Source);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Check transparency for PNG preservation
      const isTransparent = isPngHint && hasAlphaChannel(ctx, width, height);

      if (isTransparent) {
        const pngData = canvas.toDataURL('image/png');
        resolve(pngData);
      } else {
        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(base64Source);
    };
  });
};
