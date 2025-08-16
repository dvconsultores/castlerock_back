import { Transform } from 'class-transformer';

export function ToEmptyArray() {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
      return [];
    }
    return Array.isArray(value) ? value : [value];
  });
}
