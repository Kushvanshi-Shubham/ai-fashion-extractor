export class ImageProcessor {
  private readonly MAX_SIZE = 2 * 1024 * 1024; // 2MB

  async processImage(file: File, compressImageFn?: (file: File) => Promise<string>): Promise<string> {
    this.validateFile(file);

    if (file.size < this.MAX_SIZE) {
      return this.toBase64(file);
    }

    if (compressImageFn) {
      return await compressImageFn(file);
    } else {
      throw new Error('Compression function not provided');
    }
  }

  async createPreviewUrl(file: File): Promise<string> {
    return this.toBase64(file);
  }

  private validateFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    if (file.size > 10 * 1024 * 1024) {
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
}
