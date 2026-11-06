jest.mock('@/lib/firebase', () => ({ db: {} }));
import { isValidTrainerName } from '@/lib/trainer-name';

it('accepts 3-20 letters, digits and underscore', () => {
  expect(isValidTrainerName('Petrel2487')).toBe(true);
  expect(isValidTrainerName(' a_b ')).toBe(true);
  expect(isValidTrainerName('ab')).toBe(false);
  expect(isValidTrainerName('has space')).toBe(false);
  expect(isValidTrainerName('ñandú')).toBe(false);
  expect(isValidTrainerName('x'.repeat(21))).toBe(false);
});
