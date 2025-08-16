import { Transform } from 'class-transformer';

export function ToArray() {
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value;

    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((v) => v.trim());
    }

    if (value == 'null' || value === null) {
      return [];
    }

    return [value];
  });
}
