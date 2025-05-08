import { Transform } from 'class-transformer';

export function StringToNumber() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return Number(value);
    }
    return value;
  });
}
