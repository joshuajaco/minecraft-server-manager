import { Result } from "../lib/result";

export type Validation<T> = (formData: FormData) => Promise<Result<T, string>>;
