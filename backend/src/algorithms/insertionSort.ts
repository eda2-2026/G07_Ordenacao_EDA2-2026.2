import { SortContext } from './context';

export function insertionSort<T>(data: T[], ctx: SortContext<T>): T[] {
  const n = data.length;
  for (let i = 1; i < n; i++) {
    const key = data[i];
    let j = i - 1;
    while (j >= 0 && ctx.compare(data[j], key, j, i) > 0) {
      ctx.move(data, j + 1, data[j]);
      j--;
    }
    if (j + 1 !== i) {
      ctx.move(data, j + 1, key);
    }
  }
  return data;
}
