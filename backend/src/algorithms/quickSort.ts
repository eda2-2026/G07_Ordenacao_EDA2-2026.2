import { SortContext } from './context';

function partition<T>(data: T[], low: number, high: number, ctx: SortContext<T>): number {
  const pivot = data[high];
  let boundary = low;
  for (let j = low; j < high; j++) {
    if (ctx.compare(data[j], pivot, j, high) < 0) {
      ctx.swap(data, boundary, j);
      boundary++;
    }
  }
  ctx.swap(data, boundary, high);
  return boundary;
}

function quick<T>(data: T[], low: number, high: number, ctx: SortContext<T>): void {
  while (low < high) {
    const p = partition(data, low, high, ctx);
    if (p - low < high - p) {
      quick(data, low, p - 1, ctx);
      low = p + 1;
    } else {
      quick(data, p + 1, high, ctx);
      high = p - 1;
    }
  }
}

export function quickSort<T>(data: T[], ctx: SortContext<T>): T[] {
  quick(data, 0, data.length - 1, ctx);
  return data;
}
