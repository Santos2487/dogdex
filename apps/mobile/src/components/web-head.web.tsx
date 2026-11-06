import Head from 'expo-router/head';

/** Keeps the Next app's PWA behaviour (installable, same manifest/icons/theme colour). */
export function WebHead() {
  return (
    <Head>
      <title>CanisQuest</title>
      <meta name="description" content="Discover, identify and collect dog breeds with AI." />
      <meta name="theme-color" content="#F6C338" />
      <link rel="manifest" href="/manifest.json" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </Head>
  );
}
