/**
 * Native: build a Blob from the local JPEG file via XMLHttpRequest. On Android the global
 * fetch(file://...) returned a 14-byte "File not found" body, and React Native's Blob can't
 * be constructed from an ArrayBuffer, so this is the reliable path for Firebase Storage.
 */
export function photoBlob(photo: { uri: string; base64: string }): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Could not read the photo file'));
    xhr.responseType = 'blob';
    xhr.open('GET', photo.uri, true);
    xhr.send(null);
  });
}
