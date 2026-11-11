import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

export type PreparedPhoto = { uri: string; base64: string };

const MAX_WIDTH = 1280;

export class PermissionDeniedError extends Error {}

/** Opens the camera or library; returns null if the user cancels. */
export async function pickPhoto(source: 'camera' | 'library'): Promise<ImagePicker.ImagePickerAsset | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1, exif: false };
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) throw new PermissionDeniedError('Camera permission denied');
    const res = await ImagePicker.launchCameraAsync(options);
    return res.canceled ? null : res.assets[0];
  }
  const res = await ImagePicker.launchImageLibraryAsync(options);
  return res.canceled ? null : res.assets[0];
}

/** Downscale to <=1280px wide JPEG; the web app sent full-size data URIs to Gemini and Storage. */
export async function preparePhoto(asset: { uri: string; width?: number }): Promise<PreparedPhoto> {
  const ctx = ImageManipulator.manipulate(asset.uri);
  if (asset.width && asset.width > MAX_WIDTH) ctx.resize({ width: MAX_WIDTH });
  const image = await ctx.renderAsync();
  const result = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  if (!result.base64) throw new Error('Could not encode photo');
  return { uri: result.uri, base64: result.base64 };
}
