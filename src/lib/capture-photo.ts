import {
  deleteObject,
  ref,
  type FirebaseStorage,
  type StorageReference,
} from 'firebase/storage';

export function isObjectNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === 'storage/object-not-found'
  );
}

/**
 * Deletes a capture's photo from Storage.
 *
 * Resolves if the photo is gone (including when it was already missing), and
 * rejects on any other error, so the caller can keep the Firestore entry and
 * let the user retry instead of orphaning the photo.
 */
export async function deleteCapturePhoto(
  storage: FirebaseStorage,
  photoUrl: string | undefined | null
): Promise<void> {
  if (!photoUrl) return;

  try {
    await deleteObject(ref(storage, photoUrl));
  } catch (error) {
    if (!isObjectNotFound(error)) throw error;
  }
}

/**
 * Best-effort removal of a photo uploaded for a save that then failed.
 * Never throws: the original save error is what the user needs to see.
 */
export async function discardUploadedPhoto(
  photoRef: StorageReference
): Promise<void> {
  try {
    await deleteObject(photoRef);
  } catch (error) {
    if (!isObjectNotFound(error)) {
      console.warn('Could not remove photo after failed save:', error);
    }
  }
}
