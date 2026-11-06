import { base64ToBytes } from '@/lib/base64';

/** Web: decode the base64 JPEG produced by preparePhoto. */
export async function photoBlob(photo: { uri: string; base64: string }): Promise<Blob> {
  return new Blob([base64ToBytes(photo.base64) as BlobPart], { type: 'image/jpeg' });
}
