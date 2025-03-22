export type OkResult<T> = { readonly ok: true; readonly val: T };
export type ErrResult<E> = { readonly ok: false; readonly err: E };
export type Result<T, E> = OkResult<T> | ErrResult<E>;

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
