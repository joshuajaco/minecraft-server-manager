export type Untrusted<T> = { [P in keyof T]?: unknown };

type RuntimeType =
  | "string"
  | "number"
  | "bigint"
  | "boolean"
  | "symbol"
  | "undefined"
  | "object";

type RuntimeTypeMap = {
  string: string;
  number: number;
  bigint: bigint;
  boolean: boolean;
  symbol: symbol;
  undefined: undefined;
  object: object;
};

export function assertTypeOf<T extends RuntimeType>(
  value: unknown,
  ...types: T[]
): asserts value is RuntimeTypeMap[T] {
  if (!types.some((t) => typeof value === t)) {
    throw new TypeError(`Expected '${types.join(" | ")}', got '${value}'`);
  }
}

export function assertInstanceOf<T>(
  value: unknown,
  constructor: abstract new (...args: any) => T,
): asserts value is T {
  if (!(value instanceof constructor)) {
    throw new TypeError(
      `Expected instance of '${constructor}', got '${value}'`,
    );
  }
}
