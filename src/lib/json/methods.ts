import type { Untrusted } from "../assert";
import type { Json } from ".";

export function parse(str: string): Json;
export function parse<T extends Json>(str: string): Untrusted<T>;
export function parse(str: string) {
  return JSON.parse(str);
}

export function stringify(json: Json): string {
  return JSON.stringify(json);
}
