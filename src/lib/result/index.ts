export type OkResult<T> = { readonly ok: true; readonly val: T };
export type ErrResult<E> = { readonly ok: false; readonly err: E };
export type Result<T, E> = OkResult<T> | ErrResult<E>;

export * from "./methods";
export * as Result from "./methods";
