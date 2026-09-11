export type Comparator<T> = (a: T, b: T) => number;

export type StepKind = 'compare' | 'swap' | 'move';

export interface StepEvent<T> {
  kind: StepKind;
  state: readonly T[];
  highlights: number[];
  comparisons: number;
  swaps: number;
  movements: number;
}

export type StepObserver<T> = (event: StepEvent<T>) => void;

export class SortContext<T> {
  comparisons = 0;
  swaps = 0;
  movements = 0;

  constructor(
    private readonly comparator: Comparator<T>,
    private readonly state: T[],
    private readonly observer?: StepObserver<T>
  ) {}

  compare(a: T, b: T, ...highlights: number[]): number {
    this.comparisons++;
    this.notify('compare', highlights);
    return this.comparator(a, b);
  }

  swap(array: T[], i: number, j: number): void {
    if (i === j) return;
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    this.swaps++;
    this.movements += 2;
    this.notify('swap', [i, j]);
  }

  move(array: T[], index: number, value: T): void {
    array[index] = value;
    this.movements++;
    this.notify('move', [index]);
  }

  private notify(kind: StepKind, highlights: number[]): void {
    if (!this.observer) return;
    this.observer({
      kind,
      state: this.state.slice(),
      highlights,
      comparisons: this.comparisons,
      swaps: this.swaps,
      movements: this.movements
    });
  }
}
