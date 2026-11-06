import { base64ToBytes } from '@/lib/base64';

it.each(['', 'f', 'fo', 'foo', 'foob', 'fooba', 'foobar', 'ÿ\u0000\u0080binary'])('round-trips %j', (str) => {
  const bytes = Buffer.from(str, 'latin1');
  expect(Buffer.from(base64ToBytes(bytes.toString('base64')))).toEqual(bytes);
});
