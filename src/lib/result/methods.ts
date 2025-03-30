import type { Result, OkResult, ErrResult } from ".";

export function Ok(): OkResult<void>;
export function Ok<const T>(val?: undefined): OkResult<T | undefined>;
export function Ok<const T>(val: T): OkResult<T>;
export function Ok(val?: unknown) {
  return { ok: true, val };
}

export function Err(): ErrResult<void>;
export function Err<const E>(err?: undefined): ErrResult<E | undefined>;
export function Err<const E>(err: E): ErrResult<E>;
export function Err(err?: unknown) {
  return { ok: false, err };
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) return result.val;
  throw new Error(`Unexpected error result: ${result.err}`);
}

export function expect<T, E>(result: Result<T, E>, message: string): T {
  if (result.ok) return result.val;
  throw new Error(message);
}

export function assert<T, E>(
  result: Result<T, E>,
  message?: string,
): asserts result is OkResult<T> {
  if (!result.ok) {
    throw new Error(message ?? `Unexpected error result: ${result.err}`);
  }
}
