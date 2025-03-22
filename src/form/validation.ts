import { Result } from "../result";

export type Validation<T> = (formData: FormData) => Promise<Result<T, string>>;
