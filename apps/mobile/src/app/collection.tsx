import { Redirect } from 'expo-router';

/** The Next app's collection lived at /collection (also the old PWA landing page); keep the URL working. */
export default function LegacyCollection() {
  return <Redirect href="/" />;
}
