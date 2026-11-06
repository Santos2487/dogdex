import { strings } from '@/lib/i18n';

function shape(o: unknown): unknown {
  if (Array.isArray(o)) return o.map(shape);
  if (o && typeof o === 'object') return Object.fromEntries(Object.keys(o).sort().map((k) => [k, shape((o as any)[k])]));
  return typeof o;
}

it('es has exactly the same keys as en', () => {
  expect(shape(strings.es)).toEqual(shape(strings.en));
});
