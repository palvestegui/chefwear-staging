export const compressImage = async (base64: string): Promise<string> => {
  if (!base64 || !base64.startsWith('data:image')) return base64;
    
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn('Compresión lenta, usando original');
      resolve(base64);
    }, 5000);

    const img = new Image();
    img.src = base64;
    img.onload = () => {
      clearTimeout(timeout);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_DIM = 400; // Muy agresivo para asegurar éxito

      if (width > height) {
        if (width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        }
      } else {
        if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      const result = canvas.toDataURL('image/jpeg', 0.4);
      resolve(result.length < base64.length ? result : base64);
    };
    img.onerror = () => {
      clearTimeout(timeout);
      resolve(base64);
    };
  });
};
