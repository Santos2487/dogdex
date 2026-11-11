// `getReactNativePersistence` ships in firebase/auth's react-native build, which Metro
// resolves, but the package's default typings omit it.
import 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
