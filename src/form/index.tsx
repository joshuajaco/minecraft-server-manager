import { Result } from "../result";
import { ReactNode } from "react";
import { Validation } from "./validation";
import { FormClient } from "./client";

type Props<T> = {
  action: (values: T) => Promise<Result<string, string>>;
  validate: Validation<T>;
  className?: string;
  children?: ReactNode;
};

export function Form<T>({ action, validate, className, children }: Props<T>) {
  async function wrappedAction(
    _: unknown,
    formData: FormData,
  ): Promise<Result<string, string>> {
    "use server";
    const values = await validate(formData);
    if (!values.ok) return values;
    return action(values.val);
  }

  return (
    <FormClient action={wrappedAction} className={className}>
      {children}
    </FormClient>
  );
}
