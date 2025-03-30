export type Json = string | number | boolean | null | Array<Json> | JsonObject;
export type JsonObject = { [P in string]?: Json };

export * from "./methods";
export * as Json from "./methods";
