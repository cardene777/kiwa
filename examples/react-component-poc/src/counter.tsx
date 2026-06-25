import { useState } from 'react';

export interface CounterProps {
  initial?: number;
  step?: number;
  max?: number;
}

export function Counter({ initial = 0, step = 1, max }: CounterProps): JSX.Element {
  const [count, setCount] = useState(initial);
  const reachedMax = max !== undefined && count >= max;
  return (
    <div>
      <span data-testid="value">{count}</span>
      <button
        type="button"
        aria-label="increment"
        disabled={reachedMax}
        onClick={() => setCount((prev) => prev + step)}
      >
        +
      </button>
      <button
        type="button"
        aria-label="reset"
        onClick={() => setCount(initial)}
      >
        reset
      </button>
      {reachedMax && <span role="status">max reached</span>}
    </div>
  );
}
