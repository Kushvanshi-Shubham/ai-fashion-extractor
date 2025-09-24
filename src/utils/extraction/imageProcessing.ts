export class ImageProcessor {
  private readonly MAX_SIZE = 2 * 1024 * 1024; // 2MB
  private readonly QUALITY = 0.8;

  async processImage(file: File): Promise<string> {
    // Validate file
    this.validateFile(file);
    
    // Create base64
    const base64 = await this.toBase64(file);
    
    // Compress if needed
    if (base64.length > this.MAX_SIZE) {
      return this.compressImage(file);
    }
    
    return base64;
  }

  async createPreviewUrl(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  private validateFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('Image file too large. Maximum size is 10MB.');
    }
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  }

  private async compressImage(file: File): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', this.QUALITY));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
}
