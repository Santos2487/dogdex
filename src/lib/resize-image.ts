/**
 * Client-side photo preparation for capture.
 *
 * Phone photos are several MB; as a base64 data URI they exceed the 1 MB
 * default body limit of the `identifyDogBreed` server action. We downscale to
 * at most MAX_EDGE px on the long edge and re-encode as JPEG before the photo
 * goes into the capture store (and later to Storage).
 */

export const MAX_EDGE = 1280;
export const JPEG_QUALITIES = [0.8, 0.65, 0.5] as const;

/**
 * Largest data URI we send to the server action. Leaves headroom under the
 * 1 MB limit for the JSON envelope.
 */
export const MAX_DATA_URI_LENGTH = 900_000;

export function fitWithin(
  width: number,
  height: number,
  maxEdge: number = MAX_EDGE
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };

  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function decode(file: Blob): Promise<ImageBitmap> {
  // `from-image` applies EXIF orientation, so portrait phone photos stay upright.
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}

export class PhotoTooLargeError extends Error {
  constructor() {
    super('Photo is too large to analyse.');
    this.name = 'PhotoTooLargeError';
  }
}

/**
 * Returns a JPEG data URI of at most MAX_EDGE px and MAX_DATA_URI_LENGTH chars.
 *
 * If the browser can't decode the file (e.g. HEIC on desktop Chrome), the
 * original is used when it is already small enough. Otherwise throws
 * PhotoTooLargeError, or the decode error.
 */
export async function preparePhoto(file: File): Promise<string> {
  let bitmap: ImageBitmap;

  try {
    bitmap = await decode(file);
  } catch (error) {
    const original = await readAsDataUrl(file);
    if (original.length <= MAX_DATA_URI_LENGTH) return original;
    throw error;
  }

  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D context unavailable.');
    context.drawImage(bitmap, 0, 0, width, height);

    for (const quality of JPEG_QUALITIES) {
      const dataUri = canvas.toDataURL('image/jpeg', quality);
      if (dataUri.length <= MAX_DATA_URI_LENGTH) return dataUri;
    }

    throw new PhotoTooLargeError();
  } finally {
    bitmap.close();
  }
}
