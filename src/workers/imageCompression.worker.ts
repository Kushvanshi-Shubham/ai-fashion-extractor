// Image compression worker for handling large images before AI processing

export interface CompressMessage {
  type: 'COMPRESS';
  payload: File;
}

export interface CompressResult {
  success: boolean;
  data?: string;
  error?: string;
}

// Listen for messages from main thread
self.addEventListener('message', async (event: MessageEvent<CompressMessage>) => {
  const { type, payload } = event.data;
  
  if (type === 'COMPRESS') {
    try {
      const compressedBase64 = await compressImage(payload);
      const result: CompressResult = {
        success: true,
        data: compressedBase64
      };
      self.postMessage(result);
    } catch (error) {
      const result: CompressResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Compression failed'
      };
      self.postMessage(result);
    }
  }
});

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = new OffscreenCanvas(800, 800);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const { width, height } = calculateDimensions(img.width, img.height, 800);
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.convertToBlob({ 
        type: 'image/jpeg', 
        quality: 0.8 
      }).then(blob => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to convert blob to base64'));
        reader.readAsDataURL(blob);
      }).catch(reject);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

function calculateDimensions(origWidth: number, origHeight: number, maxSize: number): { width: number; height: number } {
  if (origWidth <= maxSize && origHeight <= maxSize) {
    return { width: origWidth, height: origHeight };
  }
  
  const ratio = Math.min(maxSize / origWidth, maxSize / origHeight);
  return {
    width: Math.round(origWidth * ratio),
    height: Math.round(origHeight * ratio)
  };
}
