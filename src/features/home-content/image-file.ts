/**
 * Reads an image file into a PNG/JPEG data URL scaled to fit `maxSize`, so
 * icons and tile images stay small enough to store inline.
 */
export function readImageFile(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('That file is not an image'));
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
        const keepAlpha = file.type === 'image/png' || file.type === 'image/webp';
        resolve(
          keepAlpha
            ? canvas.toDataURL('image/png')
            : canvas.toDataURL('image/jpeg', 0.82),
        );
      };
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function isImageRef(value: string | null | undefined): value is string {
  return !!value && /^(https?:\/\/|data:image\/)/i.test(value);
}
