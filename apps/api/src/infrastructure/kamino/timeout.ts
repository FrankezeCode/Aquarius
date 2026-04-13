export class TimeoutError extends Error {
  readonly code = "TIMEOUT" as const;
  constructor(label: string, public readonly timeoutMs: number) {
    super(`${label} timed out after ${timeoutMs}ms`);
    this.name = "TimeoutError";
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string
): Promise<T> {
  if (timeoutMs <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(new TimeoutError(label, timeoutMs));
    }, timeoutMs);
    promise.then(
      (v) => {
        clearTimeout(id);
        resolve(v);
      },
      (e) => {
        clearTimeout(id);
        reject(e);
      }
    );
  });
}
